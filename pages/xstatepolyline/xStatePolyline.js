import Konva from "konva";
import { createMachine, interpret } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiPgBoQmRQF91KtFjyEi0sAAVUBcdXrNaANSb8hSEGjGTpshQmWqNWpxhwExIYmZhaMrBzc9rLOElIyjh5eap6a2v56QYQh+OZMsADGAIbIYNGOsa4JoEkqKXxpfrqBRAC2RfiYOeKwYVY0tuUiLvHuinU+6c367Z3dvbThbJy8gjGicW6J496pvjoBMx1dprkLlhErPACMDsOb1fI79Y0HmW3H8xQAQkUFANawZB-MprCobKpjTwTPZTQ7EWYnMy9X4AoEgm53PwjLY1RAAJgArHwiABmIkAFgAnHxSQB2UlUgBsTNJMKJJPJhOptIZzKZ+KZrwyLURXyYuTAACchtiHlDkpMmvCPnNTj0KPliqVZZVRttobsGo18KgIHB1tMwOscY8PABaCkADhh9qddKI1xZTMJTqp1wpTKd+Ip+OFVpIZGt4NtCvZFONcPewXVNvlBsVCHpFKIxL4+YTpIppKZVLpFPDKrF6vgMfTeMNKWJVKI+bbTr4Qb5hM0miAA */
        id: "polyLine",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "onePoint",
                        actions: "createLine",
                    },
                },
            },
            onePoint: {
                on: {
                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },
                    MOUSECLICK: {
                        target: "manyPoints",
                        actions: "addPoint",
                    },
                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },
                },
            },
            manyPoints: {
                on: {
                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },
                    MOUSECLICK: [
                        {
                            target: "manyPoints",
                            actions: "addPoint",
                            cond: "pasPlein",
                        },
                        {
                            target: "idle",
                            actions: ["addPoint", "saveLine"],
                        },
                    ],
                    Backspace: [
                        {
                            cond: "plusDeDeuxPoints",
                            actions: "removeLastPoint",
                        },
                        {
                            target: "onePoint",
                            actions: "removeLastPoint",
                        },
                    ],
                    Enter: {
                        target: "idle",
                        actions: "saveLine",
                    },
                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },
                },
            },
        },
    },
    {
        actions: {
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points();
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points();
                const newPoints = [...currentPoints, pos.x, pos.y];
                polyline.points(newPoints);
                layer.batchDraw();
            },
            saveLine: (context, event) => {
                const currentPoints = polyline.points();
                const size = currentPoints.length;
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            abandon: (context, event) => {
                if (polyline) {
                    polyline.destroy();
                    polyline = null;
                }
                layer.batchDraw();
            },
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points();
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size);
                const oldPoints = currentPoints.slice(0, size - 4);
                polyline.points(oldPoints.concat(provisoire));
                layer.batchDraw();
            },
        },
        guards: {
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            plusDeDeuxPoints: (context, event) => {
                return polyline.points().length > 6;
            },
        },
    }
);

const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();

stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

window.addEventListener("keydown", (event) => {
    polylineService.send(event.key);
});
