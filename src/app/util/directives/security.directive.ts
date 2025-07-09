import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { SecurityService } from '../service/security.service';
import { SecurityEventType, SecurityLevel } from '../service/security.service';

/**
 * Security directive for client-side security features
 * Provides input sanitization, XSS prevention, and security monitoring
 */
@Directive({
  selector: '[appSecurity]',
  standalone: true
})
export class SecurityDirective implements OnInit {
  
  @Input() appSecurity: 'strict' | 'moderate' | 'relaxed' = 'moderate';
  @Input() enableSanitization = true;
  @Input() enableMonitoring = true;
  @Input() blockSuspiciousInput = true;

  private readonly suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi
  ];

  private readonly dangerousTags = [
    'script', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'button'
  ];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private securityService: SecurityService
  ) {}

  ngOnInit(): void {
    this.setupSecurityFeatures();
  }

  /**
   * Setup security features based on configuration
   */
  private setupSecurityFeatures(): void {
    if (this.enableSanitization) {
      this.sanitizeElement();
    }

    if (this.enableMonitoring) {
      this.setupEventMonitoring();
    }

    // Add security attributes
    this.addSecurityAttributes();
  }

  /**
   * Sanitize the element content
   */
  private sanitizeElement(): void {
    const element = this.el.nativeElement;
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      this.sanitizeInputElement(element);
    } else {
      this.sanitizeContentElement(element);
    }
  }

  /**
   * Sanitize input elements
   */
  private sanitizeInputElement(element: HTMLElement): void {
    // Add input validation
    this.renderer.setAttribute(element, 'autocomplete', 'off');
    this.renderer.setAttribute(element, 'spellcheck', 'false');
    
    // Add pattern validation for suspicious content
    if (this.blockSuspiciousInput) {
      const pattern = this.suspiciousPatterns
        .map(p => p.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
      
      if (pattern) {
        this.renderer.setAttribute(element, 'pattern', `^(?!.*(${pattern})).*$`);
      }
    }
  }

  /**
   * Sanitize content elements
   */
  private sanitizeContentElement(element: HTMLElement): void {
    // Remove dangerous tags and attributes
    this.removeDangerousContent(element);
    
    // Sanitize existing content
    this.sanitizeContent(element.innerHTML);
  }

  /**
   * Remove dangerous content from element
   */
  private removeDangerousContent(element: HTMLElement): void {
    // Remove dangerous tags
    this.dangerousTags.forEach(tag => {
      const dangerousElements = element.getElementsByTagName(tag);
      Array.from(dangerousElements).forEach(el => {
        el.remove();
      });
    });

    // Remove dangerous attributes
    const allElements = element.getElementsByTagName('*');
    Array.from(allElements).forEach(el => {
      this.removeDangerousAttributes(el as HTMLElement);
    });
  }

  /**
   * Remove dangerous attributes from element
   */
  private removeDangerousAttributes(element: HTMLElement): void {
    const dangerousAttributes = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload'
    ];

    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
  }

  /**
   * Sanitize content string
   */
  private sanitizeContent(content: string): string {
    let sanitized = content;
    
    // Remove suspicious patterns
    this.suspiciousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Remove HTML comments that might contain malicious code
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    
    return sanitized;
  }

  /**
   * Setup event monitoring
   */
  private setupEventMonitoring(): void {
    // Monitor for suspicious input
    this.el.nativeElement.addEventListener('input', (event: Event) => {
      this.monitorInput(event);
    });

    // Monitor for paste events
    this.el.nativeElement.addEventListener('paste', (event: Event) => {
      this.monitorPaste(event);
    });

    // Monitor for drag and drop
    this.el.nativeElement.addEventListener('drop', (event: Event) => {
      this.monitorDrop(event);
    });
  }

  /**
   * Monitor input events for suspicious content
   */
  private monitorInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    if (this.isSuspiciousContent(value)) {
      this.handleSuspiciousInput('input', value);
      
      if (this.appSecurity === 'strict') {
        target.value = this.sanitizeContent(value);
      }
    }
  }

  /**
   * Monitor paste events
   */
  private monitorPaste(event: Event): void {
    const clipboardData = (event as ClipboardEvent).clipboardData;
    if (clipboardData) {
      const pastedText = clipboardData.getData('text/plain');
      
      if (this.isSuspiciousContent(pastedText)) {
        this.handleSuspiciousInput('paste', pastedText);
        
        if (this.appSecurity === 'strict') {
          event.preventDefault();
        }
      }
    }
  }

  /**
   * Monitor drop events
   */
  private monitorDrop(event: Event): void {
    const dropEvent = event as DragEvent;
    const files = dropEvent.dataTransfer?.files;
    
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (this.isSuspiciousFile(file)) {
          this.handleSuspiciousFile(file);
          
          if (this.appSecurity === 'strict') {
            event.preventDefault();
          }
        }
      });
    }
  }

  /**
   * Check if content is suspicious
   */
  private isSuspiciousContent(content: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if file is suspicious
   */
  private isSuspiciousFile(file: File): boolean {
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    return dangerousExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Handle suspicious input
   */
  private handleSuspiciousInput(type: string, content: string): void {
    this.securityService.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.MEDIUM,
      {
        type: 'suspicious_input',
        inputType: type,
        content: content.substring(0, 100), // Limit content length
        element: this.el.nativeElement.tagName,
        securityLevel: this.appSecurity
      }
    );
  }

  /**
   * Handle suspicious file
   */
  private handleSuspiciousFile(file: File): void {
    this.securityService.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.HIGH,
      {
        type: 'suspicious_file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        element: this.el.nativeElement.tagName
      }
    );
  }

  /**
   * Add security attributes to element
   */
  private addSecurityAttributes(): void {
    const element = this.el.nativeElement;
    
    // Add CSP nonce if available
    if (window.crypto && window.crypto.getRandomValues) {
      const nonce = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      this.renderer.setAttribute(element, 'data-security-nonce', nonce);
    }
    
    // Add security level attribute
    this.renderer.setAttribute(element, 'data-security-level', this.appSecurity);
  }

  /**
   * Host listener for focus events
   */
  @HostListener('focus')
  onFocus(): void {
    if (this.enableMonitoring) {
      this.securityService.logSecurityEvent(
        SecurityEventType.SECURITY_ALERT,
        SecurityLevel.LOW,
        {
          type: 'element_focus',
          element: this.el.nativeElement.tagName,
          securityLevel: this.appSecurity
        }
      );
    }
  }

  /**
   * Host listener for blur events
   */
  @HostListener('blur')
  onBlur(): void {
    if (this.enableMonitoring) {
      const element = this.el.nativeElement as HTMLInputElement;
      const value = element.value;
      
      if (value && this.isSuspiciousContent(value)) {
        this.handleSuspiciousInput('blur', value);
      }
    }
  }

  /**
   * Host listener for keydown events
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Block certain key combinations that might be used for shortcuts
    if (this.appSecurity === 'strict') {
      const blockedCombinations = [
        { ctrl: true, key: 'u' }, // View source
        { ctrl: true, key: 's' }, // Save
        { ctrl: true, key: 'p' }, // Print
        { f12: true }, // Developer tools
        { ctrl: true, shift: true, key: 'i' }, // Developer tools
        { ctrl: true, shift: true, key: 'c' }, // Developer tools
        { ctrl: true, shift: true, key: 'j' }  // Developer tools
      ];
      
      const isBlocked = blockedCombinations.some(combo => {
        return (combo.ctrl === undefined || combo.ctrl === event.ctrlKey) &&
               (combo.shift === undefined || combo.shift === event.shiftKey) &&
               (combo.f12 === undefined || combo.f12 === (event.key === 'F12')) &&
               event.key.toLowerCase() === combo.key;
      });
      
      if (isBlocked) {
        event.preventDefault();
        this.securityService.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          SecurityLevel.MEDIUM,
          {
            type: 'blocked_keyboard_shortcut',
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            element: this.el.nativeElement.tagName
          }
        );
      }
    }
  }
} 