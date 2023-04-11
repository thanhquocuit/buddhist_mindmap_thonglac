import { useCallback, useEffect, useRef } from "react";
import { MOUSE_MOVE_CLICK_THRESHOLD } from "../constants/render.constants";
import { CANVAS_SCALE_FACTOR } from "../constants/render.constants";

function toCanvasCoords(
  pageX: number,
  pageY: number,
  scale: number,
  canvas: HTMLCanvasElement
) {
  var rect = canvas.getBoundingClientRect();
  let x = (pageX - rect.left) / scale;
  let y = (pageY - rect.top) / scale;
  return { x, y };
}

function toScreenCoords(
  x: number,
  y: number,
  scale: number,
  canvas: HTMLCanvasElement
) {
  const scrollElement = document.querySelector("html");
  var rect = canvas.getBoundingClientRect();
  let wx =
    x * scale + rect.left + (scrollElement ? scrollElement.scrollLeft : 0);
  let wy = y * scale + rect.top + (scrollElement ? scrollElement.scrollTop : 0);
  return { x: wx, y: wy };
}

export interface ClickModifiers {
  event: MouseEvent;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export interface UserInputProps {
  onClick?: (x: number, y: number, modifiers: ClickModifiers) => void;
  onDClick?: (x: number, y: number, modifiers: ClickModifiers) => void;
  onRightClick?: (x: number, y: number, modifiers: ClickModifiers) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onScroll?: (deltaX: number, deltaY: number) => void;
  onScale?: (deltaScale: number) => void;
  onMouseMove?: (x: number, y: number, modifiers: ClickModifiers) => void;
  onMouseUp?: (x: number, y: number, modifiers: ClickModifiers) => void;
}

interface MouseCoords {
  x: number;
  y: number;
}

function UserInput({
  onClick,
  onDClick,
  onRightClick,
  onPan,
  onScroll,
  onScale,
  onMouseMove,
  onMouseUp,
}: UserInputProps) {
  const mouseLastSeen = useRef<MouseCoords>();
  const mouseFirstSeen = useRef<MouseCoords>();
  const controlPressed = useRef<boolean>(false);
  const mouseDown = useRef<boolean>();

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!mouseFirstSeen.current) {
        return;
      }

      // Check the delta in coors between the down and up to see if we've moved or should handle it as a click
      const deltaX = Math.abs(e.x - mouseFirstSeen.current.x);
      const deltaY = Math.abs(e.y - mouseFirstSeen.current.y);
      if (
        deltaX > MOUSE_MOVE_CLICK_THRESHOLD ||
        deltaY > MOUSE_MOVE_CLICK_THRESHOLD
      ) {
        return;
      }

      const modifier = {
        event: e,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      };

      if (onMouseUp) onMouseUp(e.x, e.y, modifier);

      const target: any = e.target;
      if (typeof target?.getContext != "function") return;

      if (onClick) {
        const { x, y } = toCanvasCoords(e.x, e.y, 1, target);
        onClick(x, y, modifier);
      }
    },
    [onClick]
  );

  const handleRightClick = useCallback(
    (e: MouseEvent) => {
      // click on canvas. hide canvas menu
      const target: any = e.target;
      if (typeof target?.getContext == "function") e.preventDefault();

      if (onRightClick) {
        const { x, y } = toCanvasCoords(e.x, e.y, 1, target);
        onRightClick(x, y, {
          event: e,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
        });
      }
    },
    [onRightClick]
  );

  const handleMouseDBClick = useCallback(
    (e: MouseEvent) => {
      if (!mouseFirstSeen.current || !onDClick) {
        return;
      }

      const target: any = e.target;
      if (typeof target?.getContext != "function") return;

      const { x, y } = toCanvasCoords(e.x, e.y, 1, target);
      onDClick(x, y, {
        event: e,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });
    },
    [onDClick]
  );

  const handleScale = useCallback(
    (e: WheelEvent) => {
      if (!onScale) {
        return;
      }

      const target: any = e.target;
      if (typeof target?.getContext != "function") return;

      e.preventDefault();

      onScale(e.deltaY);
    },
    [onScale]
  );

  const handleScroll = useCallback(
    (e: WheelEvent) => {
      if (!onScroll) {
        return;
      }

      onScroll(e.deltaX, e.deltaY);
    },
    [onScroll]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      controlPressed.current ? handleScale(e) : handleScroll(e);
    },
    [handleScale, handleScroll]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const target: any = e.target;
      if (typeof target?.getContext != "function") return;

      if (onMouseMove) {
        const { x, y } = toCanvasCoords(e.x, e.y, 1, target);
        onMouseMove(x, y, {
          event: e,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
        });
      }

      if (!mouseDown.current || !onPan) {
        return;
      }

      const lastSeen = mouseLastSeen.current || { x: 0, y: 0 };

      const xDiff = e.x - lastSeen.x;
      const yDiff = e.y - lastSeen.y;

      mouseLastSeen.current = {
        x: e.x,
        y: e.y,
      };

      onPan(xDiff, yDiff);
    },
    [onPan, onMouseMove]
  );

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  useEffect(() => {
    window.addEventListener("contextmenu", handleRightClick);

    return () => {
      window.removeEventListener("contextmenu", handleRightClick);
    };
  }, [handleRightClick]);

  useEffect(() => {
    window.addEventListener("dblclick", handleMouseDBClick);

    return () => {
      window.removeEventListener("dblclick", handleMouseDBClick);
    };
  }, [handleMouseDBClick]);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  /**
   * Track which keys are pressed
   */
  useEffect(() => {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "Control") {
        controlPressed.current = true;
      }
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "Control") {
        controlPressed.current = false;
      }
    });
  }, []);

  /**
   * Track mouse coordinate and mouse down state
   */
  useEffect(() => {
    window.addEventListener("mousedown", (e: MouseEvent) => {
      mouseFirstSeen.current = {
        x: e.x,
        y: e.y,
      };

      mouseLastSeen.current = {
        x: e.x,
        y: e.y,
      };

      mouseDown.current = true;
    });

    window.addEventListener("mouseout", () => {
      mouseDown.current = false;
    });

    window.addEventListener("mouseup", () => {
      mouseDown.current = false;
    });
  }, []);

  return null;
}

export default UserInput;
