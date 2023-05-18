import getId from '../Util/getId';
import AoEShape from '../AoEShape';
import { Item, Label, Path } from '@owlbear-rodeo/sdk';
import Triangle from '../Util/Triangle';
import AABB from '../Util/AABB';
import Vector from '../Util/Vector';
import PathSimplifier from '../Util/PathSimplifier';

export default class Cone extends AoEShape {

    readonly label = 'Cone';
    readonly icon = '/icons/cone.svg';
    readonly id = getId('cone');

    protected createItems (): Item[] {

        const area: Path = this.buildAreaPath()
            .build();

        const outline: Path = this.buildOutlinePath()
            .attachedTo(area.id)
            .build();

        const label: Label = this.buildLabel()
            .attachedTo(area.id)
            .build();

        const ret: Item[] = [area];
        if (this.metadata.shapeDisplayMode != 'never')
            ret.push(outline);
        if (this.metadata.labelDisplayMode != 'never')
            ret.push(label);

        return ret;
    }

    private getTriangle (): Triangle {
        const angle = this.currentPosition.angleTo(this.roundedCenter);
        return Triangle.fromDirectionAndSize(this.roundedCenter, angle, this.roundedDistance);
    }

    private getItems (items: Item[]): [Path, Path?, Label?] {
        const ret: [Path, Path?, Label?] = [items.shift() as Path, undefined, undefined];
        if (this.metadata.shapeDisplayMode != 'never')
            ret[1] = items.shift() as Path;
        if (this.metadata.labelDisplayMode != 'never')
            ret[2] = items.shift() as Label;

        return ret;
    }

    protected updateItems (items: Item[], position: Vector): void {
        const [area, outline, label] = this.getItems(Array.from(items));

        const triangle = this.getTriangle();

        // Update the outline
        if (outline)
            outline.commands = triangle.pathCommand;

        // Update the area
        area.commands = this.buildAreaPathCommand(triangle).commands;

        // And the text
        if (label) {
            label.text.plainText = `${this.roundedDistance / this.dpi * (this.gridScale?.parsed?.multiplier || 0)}${this.gridScale?.parsed?.unit || ''}`;
            label.position = triangle.center;
        }
    }

    protected finalItems (items: Item[], position: Vector): Item[] {
        if (this.roundedDistance === 0) {
            return [];
        }

        const [area, outline, label] = this.getItems(Array.from(items));

        const labels: Label[] = [];
        // const triangle = this.getTriangle();
        // const bounds = triangle.getBounds(this.dpi);
        // for (let x = bounds.minX; x < bounds.maxX; x += this.dpi) {
        //     for (let y = bounds.minY; y < bounds.maxY; y += this.dpi) {
        //         const square = new AABB(x, y, this.dpi, this.dpi);
        //         const overlap = triangle.intersectsSquareAmount(square);
        //         labels.push(buildLabel()
        //             .plainText(overlap.toString())
        //             .pointerWidth(0)
        //             .pointerHeight(0)
        //             .strokeColor('#FFFFFF')
        //             .position({ x: x + this.dpi / 2, y: y + this.dpi / 2 })
        //             .attachedTo(area.id)
        //             .fontSize(10)
        //             .build());
        //     }
        // }

        // let i = 1;
        // const points = this.buildAreaPathCommand((this.getTriangle())).simplify();
        // for (const point of points) {
        //     labels.push(buildLabel()
        //         .plainText(`${i++}: ${point}`)
        //         .pointerWidth(0)
        //         .pointerHeight(0)
        //         .strokeColor('#FFFFFF')
        //         .position(point)
        //         .attachedTo(area.id)
        //         .fontSize(10)
        //         .build());
        // }

        const ret: Item[] = [area, ...labels];
        if (this.metadata.shapeDisplayMode == 'always' && outline)
            ret.push(outline);
        if (this.metadata.labelDisplayMode == 'always' && label)
            ret.push(label);

        return ret;
    }

    private buildAreaPathCommand (triangle: Triangle): PathSimplifier {
        // Work out the bounding square for our search area.
        const bounds = triangle.getBounds(this.dpi);

        // Check every square.
        const path = new PathSimplifier();
        for (let x = bounds.minX; x < bounds.maxX; x += this.dpi) {
            for (let y = bounds.minY; y < bounds.maxY; y += this.dpi) {
                const square = new AABB(x, y, this.dpi, this.dpi);
                let threshold = this.metadata.coneOverlapThreshold;
                if (!Number.isFinite(threshold))
                    threshold = 0;
                if (triangle.intersectsSquareAmount(square) > (threshold as number)) {
                    path.addSquare(square);
                }
            }
        }

        return path;
    }
}
