import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { FormControl } from '@angular/forms';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { ActionType, TriggerStrategy, TriggerType } from '@activepieces/shared';
import {
  BuilderSelectors,
  FlowItem,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import {
  TestStepService,
  ActionMetaService,
  isOverflown,
} from '@activepieces/ui/common';

@Component({
  selector: 'app-flow-right-sidebar',
  templateUrl: './flow-right-sidebar.component.html',
  styleUrls: ['./flow-right-sidebar.component.scss'],
})
export class FlowRightSidebarComponent implements OnInit {
  isOverflown = isOverflown;
  ActionType = ActionType;
  TriggerType = TriggerType;
  rightSidebarType$: Observable<RightSideBarType>;
  testFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  currentStep$: Observable<FlowItem | null | undefined>;
  editStepSectionRect: DOMRect;
  @ViewChild('editStepSection', { read: ElementRef })
  editStepSection: ElementRef;
  @ViewChild('selectedStepResultContainer', { read: ElementRef })
  selectedStepResultContainer: ElementRef;
  elevateResizer$: Observable<void>;
  animateSectionsHeightChange = false;
  isCurrentStepPollingTrigger$: Observable<boolean>;
  currentStepPieceVersion$: Observable<
    | {
        version: string;
        latest: boolean;
        tooltipText: string;
      }
    | undefined
  >;
  constructor(
    private store: Store,
    private ngZone: NgZone,
    private testStepService: TestStepService,
    private renderer2: Renderer2,
    private actionMetaDataService: ActionMetaService
  ) {}

  ngOnInit(): void {
    this.checkCurrentStepPieceVersion();
    this.rightSidebarType$ = this.store.select(
      BuilderSelectors.selectCurrentRightSideBarType
    );
    this.currentStep$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        tap(() => {
          this.elevateResizer$ = this.testStepService.elevateResizer$.pipe(
            tap((shouldAnimate) => {
              if (shouldAnimate) {
                this.resizerAnimation();
              }
            }),
            map(() => void 0)
          );
        })
      );
    this.isCurrentStepPollingTrigger$ = this.currentStep$.pipe(
      switchMap((step) => {
        if (
          step &&
          step.type === TriggerType.PIECE &&
          step.settings.pieceName !== 'schedule'
        ) {
          return this.actionMetaDataService
            .getPieceMetadata(
              step.settings.pieceName,
              step.settings.pieceVersion
            )
            .pipe(
              map((res) => {
                return (
                  res.triggers[step.settings.triggerName] &&
                  res.triggers[step.settings.triggerName].type ===
                    TriggerStrategy.POLLING
                );
              })
            );
        }
        return of(false);
      })
    );
  }

  private checkCurrentStepPieceVersion() {
    this.currentStepPieceVersion$ = this.store
      .select(BuilderSelectors.selectCurrentStepPieceVersionAndName)
      .pipe(
        switchMap((res) => {
          if (res) {
            return this.actionMetaDataService.getPiecesManifest().pipe(
              map((manifest) => {
                const piece = manifest.find((p) => p.name === res?.pieceName);
                if (piece && piece.version === res?.version) {
                  return {
                    version: res.version,
                    latest: true,
                    tooltipText: `You are using the latest version of ${piece.displayName}. Click to learn more`,
                  };
                }
                return {
                  version: res.version,
                  latest: false,
                  tooltipText:
                    `You are using an old version of ${piece?.displayName}. Click to learn more` ||
                    ``,
                };
              })
            );
          }
          return of(undefined);
        })
      );
  }

  get sidebarType() {
    return RightSideBarType;
  }
  resizerDragStarted() {
    this.editStepSectionRect =
      this.editStepSection.nativeElement.getBoundingClientRect();
  }
  resizerDragged(dragMoveEvent: CdkDragMove) {
    const height = this.editStepSectionRect.height + dragMoveEvent.distance.y;
    this.ngZone.runOutsideAngular(() => {
      this.renderer2.setStyle(
        this.editStepSection.nativeElement,
        'height',
        `${height}px`
      );
      this.renderer2.setStyle(
        this.selectedStepResultContainer.nativeElement,
        'max-height',
        `calc(100% - ${height}px - 5px)`
      );
    });
  }
  resizerAnimation() {
    this.animateSectionsHeightChange = true;
    this.renderer2.setStyle(
      this.editStepSection.nativeElement,
      'height',
      `calc(50% - 48px)`
    );
    this.renderer2.setStyle(
      this.selectedStepResultContainer.nativeElement,
      'max-height',
      `calc(50% + 26px)`
    );
    setTimeout(() => {
      this.animateSectionsHeightChange = false;
    }, 150);
  }
  resetTopResizerSectionHeight() {
    this.renderer2.removeStyle(this.editStepSection.nativeElement, 'height');
  }
  openVersionDocs() {
    window.open(
      'https://www.activepieces.com/docs/pieces/versioning',
      '_blank'
    );
  }
}
