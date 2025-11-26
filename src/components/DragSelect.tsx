"use client";

import clsx from "clsx";
// Box bound drag select from: https://www.joshuawootonn.com/react-drag-to-select#intersection-state
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

class DOMVector {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly magnitudeX: number,
    readonly magnitudeY: number,
  ) {
    this.x = x;
    this.y = y;
    this.magnitudeX = magnitudeX;
    this.magnitudeY = magnitudeY;
  }

  getDiagonalLength(): number {
    return Math.sqrt(this.magnitudeX ** 2 + this.magnitudeY ** 2);
  }

  toDOMRect(): DOMRect {
    return new DOMRect(
      Math.min(this.x, this.x + this.magnitudeX),
      Math.min(this.y, this.y + this.magnitudeY),
      Math.abs(this.magnitudeX),
      Math.abs(this.magnitudeY),
    );
  }

  toTerminalPoint(): DOMPoint {
    return new DOMPoint(this.x + this.magnitudeX, this.y + this.magnitudeY);
  }

  add(vector: DOMVector): DOMVector {
    return new DOMVector(
      this.x + vector.x,
      this.y + vector.y,
      this.magnitudeX + vector.magnitudeX,
      this.magnitudeY + vector.magnitudeY,
    );
  }

  clamp(vector: DOMRect): DOMVector {
    return new DOMVector(
      this.x,
      this.y,
      Math.min(vector.width - this.x, this.magnitudeX),
      Math.min(vector.height - this.y, this.magnitudeY),
    );
  }
}

function intersect(rect1: DOMRect, rect2: DOMRect): boolean {
  if (rect1.right < rect2.left || rect2.right < rect1.left) return false;

  if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false;

  return true;
}

function shallowEqual(x: Record<string, boolean>, y: Record<string, boolean>) {
  return (
    Object.keys(x).length === Object.keys(y).length &&
    Object.keys(x).every((key) => x[key] === y[key])
  );
}

const SelectedItemContext = createContext<Record<string, boolean>>({});

export function Root({
  children,
  initialItems,
  onSelectionChange,
}: {
  children?: ReactNode;
  initialItems?: Record<string, boolean>;
  onSelectionChange?: (items: Record<string, boolean>) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, _setDragMode] = useState<"select" | "deselect">("select");

  const [dragVector, setDragVector] = useState<DOMVector | null>(null);
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    initialItems ?? {},
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialItems) {
      setSelectedItems(initialItems);
    }
  }, [initialItems]);

  const updateSelectedItems = useCallback(
    function updateSelectedItems(
      dragVector: DOMVector,
      scrollVector: DOMVector,
    ) {
      if (containerRef.current == null) return;
      const next = { ...selectedItems };
      const containerRect = containerRef.current.getBoundingClientRect();
      containerRef.current.querySelectorAll("[data-item]").forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        if (containerRef.current == null) return;

        const itemRect = el.getBoundingClientRect();
        const translatedItemRect = new DOMRect(
          itemRect.x - containerRect.x + containerRef.current.scrollLeft,
          itemRect.y - containerRect.y + containerRef.current.scrollTop,
          itemRect.width,
          itemRect.height,
        );

        if (
          !intersect(
            dragVector.add(scrollVector).toDOMRect(),
            translatedItemRect,
          )
        )
          return;

        const itemId = el.dataset.item;
        if (itemId && typeof itemId === "string") {
          if (dragMode === "select") {
            next[itemId] = true;
          } else {
            delete next[itemId];
          }
        }
      });
      if (!shallowEqual(next, selectedItems)) {
        setSelectedItems(next);
      }
    },
    [selectedItems, dragMode],
  );

  useEffect(() => {
    if (!isDragging || containerRef.current == null) return;

    let handle = requestAnimationFrame(scrollTheLad);

    return () => cancelAnimationFrame(handle);

    function clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max);
    }

    function scrollTheLad() {
      if (containerRef.current == null || dragVector == null) return;

      const currentPointer = dragVector.toTerminalPoint();
      const containerRect = containerRef.current.getBoundingClientRect();

      const shouldScrollRight = containerRect.width - currentPointer.x < 20;
      const shouldScrollLeft = currentPointer.x < 20;
      const shouldScrollDown = containerRect.height - currentPointer.y < 20;
      const shouldScrollUp = currentPointer.y < 20;

      const left = shouldScrollRight
        ? clamp(20 - containerRect.width + currentPointer.x, 0, 20)
        : shouldScrollLeft
          ? -1 * clamp(20 - currentPointer.x, 0, 20)
          : undefined;

      const top = shouldScrollDown
        ? clamp(20 - containerRect.height + currentPointer.y, 0, 20)
        : shouldScrollUp
          ? -1 * clamp(20 - currentPointer.y, 0, 20)
          : undefined;

      if (top === undefined && left === undefined) {
        handle = requestAnimationFrame(scrollTheLad);
        return;
      }

      containerRef.current.scrollBy({
        left,
        top,
      });

      handle = requestAnimationFrame(scrollTheLad);
    }
  }, [isDragging, dragVector]);

  const selectionRect =
    dragVector && scrollVector && containerRef.current
      ? dragVector
          .add(scrollVector)
          .clamp(
            new DOMRect(
              0,
              0,
              containerRef.current.scrollWidth,
              containerRef.current.scrollHeight,
            ),
          )
          .toDOMRect()
      : null;

  return (
    <div>
      <div className="relative z-10 flex flex-row justify-between">
        {/* <div className="px-2 border-2 border-black bg-white">
                    selectable area
                </div> */}
        {/* {Object.keys(selectedItems).length > 0 && (
                    <div className="px-2 border-2 border-black bg-white">
                        count: {Object.keys(selectedItems).length}
                    </div>
                )} */}
      </div>
      <div
        className="availability-chart-grid-container relative z-0 border-black grid grid-cols-[repeat(20,min-content)] gap-4 p-4 max-h-96 overflow-auto focus:outline-none focus:border-dashed -translate-y-0.5"
        ref={containerRef}
        onScroll={(e) => {
          if (dragVector == null || scrollVector == null) return;

          const { scrollLeft, scrollTop } = e.currentTarget;

          const nextScrollVector = new DOMVector(
            scrollVector.x,
            scrollVector.y,
            scrollLeft - scrollVector.x,
            scrollTop - scrollVector.y,
          );

          setScrollVector(nextScrollVector);
          updateSelectedItems(dragVector, nextScrollVector);
        }}
        onPointerDown={(e) => {
          console.log("d");

          if (e.button !== 0) return;
          console.log("down");

          const target = e.target as HTMLElement;
          const itemElement = target.closest<HTMLElement>("[data-item]");

          if (itemElement?.dataset.item) {
            const itemId = itemElement.dataset.item;
            if (selectedItems[itemId]) {
              _setDragMode("deselect");
            } else {
              _setDragMode("select");
            }
          } else {
            _setDragMode("select");
          }

          const containerRect = e.currentTarget.getBoundingClientRect();
          setDragVector(
            new DOMVector(
              e.clientX - containerRect.x,
              e.clientY - containerRect.y,
              0,
              0,
            ),
          );
          setScrollVector(
            new DOMVector(
              e.currentTarget.scrollLeft,
              e.currentTarget.scrollTop,
              0,
              0,
            ),
          );

          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragVector == null || scrollVector == null) return;

          const containerRect = e.currentTarget.getBoundingClientRect();

          const nextDragVector = new DOMVector(
            dragVector.x,
            dragVector.y,
            e.clientX - containerRect.x - dragVector.x,
            e.clientY - containerRect.y - dragVector.y,
          );
          const selection = document.getSelection();
          const elementFromPoint = document.elementFromPoint(
            e.clientX,
            e.clientY,
          );

          if (!isDragging && nextDragVector.getDiagonalLength() < 10) return;
          if (
            !selection?.isCollapsed &&
            selection?.focusNode?.textContent === elementFromPoint?.textContent
          ) {
            setDragVector(null);
            return;
          }

          setIsDragging(true);

          selection?.removeAllRanges();

          setDragVector(nextDragVector);
          updateSelectedItems(nextDragVector, scrollVector);
        }}
        onPointerUp={(e) => {
          if (!isDragging) {
            const target = e.target as HTMLElement;
            const itemElement = target.closest<HTMLElement>("[data-item]");
            if (itemElement?.dataset.item) {
              const itemId = itemElement.dataset.item;
              setSelectedItems((prev) => {
                const next = { ...prev };
                if (next[itemId]) {
                  delete next[itemId];
                } else {
                  next[itemId] = true;
                }
                onSelectionChange?.(next);
                return next;
              });
            }
          } else {
            onSelectionChange?.(selectedItems);
            setIsDragging(false);
          }
          setDragVector(null);
          setScrollVector(null);
        }}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setSelectedItems({});
            setDragVector(null);
            onSelectionChange?.({});
            setScrollVector(null);
            setIsDragging(false);
          }
        }}
      >
        <SelectedItemContext.Provider value={selectedItems}>
          {children}
        </SelectedItemContext.Provider>
        {selectionRect && isDragging && (
          <div
            className="absolute border-black border-2 bg-black/30"
            style={{
              top: selectionRect.y,
              left: selectionRect.x,
              width: selectionRect.width,
              height: selectionRect.height,
              zIndex: 90,
              display: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function Item({ children, id }: { id: string; children: ReactNode }) {
  const selectedItems = useContext(SelectedItemContext);
  return (
    <div
      data-item={id}
      className={clsx(
        "pointer-events-none",
        "border-2 size-10 border-black flex justify-center items-center",
        selectedItems[id] ? "bg-black text-white" : "bg-white text-black",
      )}
    >
      {children}
    </div>
  );
}

export function InputCell({ timeId, color }) {
  const selectedItems = useContext(SelectedItemContext);

  const timeString = (() => {
    const date = new Date(timeId);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  })();

  return (
    <div
      data-item={timeId}
      className={`cell pointer-events-none select-none ${selectedItems[timeId] ? "selected" : ""}`}
      style={{ backgroundColor: color ? color : "" }}
    >
      {timeString}
    </div>
  );
}
