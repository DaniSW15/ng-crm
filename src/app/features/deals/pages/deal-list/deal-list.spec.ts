import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DealList } from './deal-list';

describe('DealList', () => {
  let component: DealList;
  let fixture: ComponentFixture<DealList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DealList],
    }).compileComponents();

    fixture = TestBed.createComponent(DealList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
