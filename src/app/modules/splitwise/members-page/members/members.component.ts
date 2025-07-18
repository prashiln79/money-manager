import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SplitwiseGroup } from 'src/app/util/models/splitwise.model';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent {
  @Input() group!: SplitwiseGroup;
  @Input() isMobile: boolean = false;
  @Output() addMember = new EventEmitter<void>();
  Math = Math; // Make Math available in template

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getGroupMemberCount(): number {
    return this.group?.members.filter(member => member.isActive).length || 0;
  }

  getPositiveBalanceMembers(): any[] {
    if (!this.group) return [];
    return this.group.members.filter(member => member.balance > 0);
  }

  getNegativeBalanceMembers(): any[] {
    if (!this.group) return [];
    return this.group.members.filter(member => member.balance < 0);
  }

  getNeutralBalanceMembers(): any[] {
    if (!this.group) return [];
    return this.group.members.filter(member => member.balance === 0);
  }

  onAddMember(): void {
    this.addMember.emit();
  }
} 