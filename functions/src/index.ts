import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function triggered whenever a new transaction is created in a family group.
 * Sends push notifications via FCM to all other active members of the family group.
 */
export const onFamilyTransactionCreated = onDocumentCreated(
  {
    document: "family-groups/{familyId}/transactions/{transactionId}",
    maxInstances: 10,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn("No snapshot data associated with event");
      return;
    }

    const { familyId, transactionId } = event.params;
    const tx = snap.data();

    // 1. Idempotency Check: Prevent duplicate notifications on retry
    if (tx.notificationSent === true) {
      logger.info("Notification already processed for transaction", {
        familyId,
        transactionId,
      });
      return;
    }

    // 2. Ignore deleted or non-active transactions
    if (tx.status === "deleted" || tx.isDeleted === true) {
      logger.info("Ignoring transaction marked as deleted", {
        familyId,
        transactionId,
      });
      return;
    }

    // 3. Identify the transaction creator
    const creatorId = tx.createdBy || tx.userId;
    if (!creatorId) {
      logger.warn("Transaction does not contain a creator ID (createdBy/userId)", {
        familyId,
        transactionId,
      });
      return;
    }

    try {
      // 4. Fetch the family group details (for group name and validation)
      const familyDocRef = db.collection("family-groups").doc(familyId);
      const familyDoc = await familyDocRef.get();

      if (!familyDoc.exists) {
        logger.warn("Family group does not exist", { familyId });
        return;
      }

      const familyData = familyDoc.data() || {};
      const groupName = familyData.name || "Family Group";

      // 5. Fetch all active members of this family group
      const membersSnapshot = await familyDocRef
        .collection("members")
        .where("isActive", "==", true)
        .get();

      if (membersSnapshot.empty) {
        logger.info("No active members found in family group", { familyId });
        await snap.ref.update({
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // Filter out the transaction creator so they don't receive their own notification
      const recipientMembers = membersSnapshot.docs
        .map((doc) => doc.data())
        .filter((member) => member.userId && member.userId !== creatorId);

      if (recipientMembers.length === 0) {
        logger.info("No other active members to notify in family group", {
          familyId,
          creatorId,
        });
        await snap.ref.update({
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // 6. Determine creator display name
      let creatorName = tx.userDisplayName;
      if (!creatorName) {
        // Fallback: look up in members subcollection or user profile
        const creatorMemberDoc = membersSnapshot.docs.find(
          (doc) => doc.data().userId === creatorId
        );
        if (creatorMemberDoc) {
          creatorName = creatorMemberDoc.data().displayName;
        }
      }
      if (!creatorName) {
        const creatorUserDoc = await db.collection("users").doc(creatorId).get();
        if (creatorUserDoc.exists) {
          const u = creatorUserDoc.data();
          creatorName = u?.displayName || u?.firstName || "A family member";
        } else {
          creatorName = "A family member";
        }
      }

      // 7. Format the notification message
      // Requirements:
      // Title: New Group Transaction
      // Message: [Member Name] added a [Income/Expense] of [Amount] in [Category]
      const txType = (tx.type || "expense").toLowerCase();
      const typeLabel = txType === "income" ? "Income" : "Expense";
      const article = typeLabel === "Income" ? "an" : "a";
      const amountValue = typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount || "0");
      const formattedAmount = isNaN(amountValue) ?
        String(tx.amount || "0") :
        amountValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const category = tx.category || tx._categoryName || "General";
      const description = tx.notes || tx.note || tx.description || "";

      const notificationTitle = "New Group Transaction";
      const notificationBody =
        `${creatorName} added ${article} ${typeLabel} of ${formattedAmount} in ${category}`;

      // 8. Fetch FCM tokens for each recipient user
      const recipientUserIds = Array.from(
        new Set(recipientMembers.map((m) => m.userId as string))
      );

      const userDocs = await db.getAll(
        ...recipientUserIds.map((uid) => db.collection("users").doc(uid))
      );

      const validTokens: string[] = [];
      const tokenToUserMap = new Map<string, string>();

      for (const userDoc of userDocs) {
        if (!userDoc.exists) continue;
        const userData = userDoc.data() || {};

        // Respect user's push notification preferences
        if (userData.preferences?.notifications === false) {
          logger.info("User opted out of notifications", { userId: userDoc.id });
          continue;
        }

        const userTokens = new Set<string>();

        // Support multiple devices via fcmTokens array
        if (Array.isArray(userData.fcmTokens)) {
          for (const token of userData.fcmTokens) {
            if (typeof token === "string" && token.trim().length > 0) {
              userTokens.add(token.trim());
            }
          }
        }

        // Support single fcmToken for backward compatibility
        if (
          typeof userData.fcmToken === "string" &&
          userData.fcmToken.trim().length > 0
        ) {
          userTokens.add(userData.fcmToken.trim());
        }

        userTokens.forEach((token) => {
          validTokens.push(token);
          tokenToUserMap.set(token, userDoc.id);
        });
      }

      if (validTokens.length === 0) {
        logger.info("No valid FCM tokens found for recipients", {
          recipientUserIds,
        });
        await snap.ref.update({
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // 9. Dispatch Multicast Message via Firebase Admin SDK
      const multicastMessage: admin.messaging.MulticastMessage = {
        tokens: validTokens,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          title: notificationTitle,
          body: notificationBody,
          familyId,
          groupName,
          transactionId,
          type: typeLabel,
          amount: String(tx.amount || ""),
          category,
          description,
          creatorName,
          url: "/dashboard/transactions",
        },
        webpush: {
          notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: "/assets/icon/app-icon/icon-192x192.png",
            badge: "/assets/icon/app-icon/icon-72x72.png",
            tag: `tx-${transactionId}`,
            data: {
              url: "/dashboard/transactions",
              familyId,
              transactionId,
            },
          },
          fcmOptions: {
            link: "/dashboard/transactions",
          },
        },
      };

      const sendResponse = await messaging.sendEachForMulticast(multicastMessage);
      logger.info("Notification dispatch summary", {
        totalTokens: validTokens.length,
        successCount: sendResponse.successCount,
        failureCount: sendResponse.failureCount,
      });

      // 10. Deactivate / remove invalid FCM tokens
      if (sendResponse.failureCount > 0) {
        const tokensToRemoveByUser = new Map<string, string[]>();

        sendResponse.responses.forEach((resp, index) => {
          if (!resp.success) {
            const token = validTokens[index];
            const errorCode = resp.error?.code;
            logger.warn("Delivery failed for token", {
              token,
              errorCode,
              error: resp.error?.message,
            });

            const isDeactivatedToken =
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered" ||
              errorCode === "messaging/mismatched-credential";

            if (isDeactivatedToken) {
              const userId = tokenToUserMap.get(token);
              if (userId) {
                const list = tokensToRemoveByUser.get(userId) || [];
                list.push(token);
                tokensToRemoveByUser.set(userId, list);
              }
            }
          }
        });

        // Batch remove invalid tokens from Firestore user profiles
        for (const [userId, tokens] of tokensToRemoveByUser.entries()) {
          try {
            await db.collection("users").doc(userId).update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokens),
            });
            logger.info("Cleaned up invalid tokens for user", {
              userId,
              count: tokens.length,
            });
          } catch (cleanErr) {
            logger.error("Failed to clean up invalid tokens", { userId, cleanErr });
          }
        }
      }

      // 11. Mark transaction as notified to prevent duplicate notifications
      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info("Transaction notification completed successfully", {
        transactionId,
      });
    } catch (error) {
      logger.error("Error processing family transaction notification", {
        error,
        familyId,
        transactionId,
      });
      // Allow retry or let Cloud Functions handle retry
      throw error;
    }
  }
);
