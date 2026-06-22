import { TestBed } from '@angular/core/testing';
import { TextInputComponent } from './text-input.component';

describe('TextInputComponent', () => {
  it('atualiza o model ao digitar', async () => {
    await TestBed.configureTestingModule({ imports: [TextInputComponent] }).compileComponents();
    const f = TestBed.createComponent(TextInputComponent);
    f.detectChanges();
    const input = (f.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'ana@ex.com';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('ana@ex.com');
  });
});
