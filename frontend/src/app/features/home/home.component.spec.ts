import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('renderiza o título do app', async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Crescendo Juntos');
  });
});
