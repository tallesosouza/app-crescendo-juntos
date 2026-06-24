import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmarEmailComponent } from './confirmar-email.component';

describe('ConfirmarEmailComponent', () => {
  it('mostra instrução de verificação e link para login', async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarEmailComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fx = TestBed.createComponent(ConfirmarEmailComponent);
    fx.detectChanges();
    const el = fx.nativeElement as HTMLElement;
    expect(el.textContent).toContain('e-mail');
    expect(el.querySelector('a[href="/login"]')).not.toBeNull();
  });
});
