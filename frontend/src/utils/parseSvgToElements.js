/**
 * Fallback parser to convert raw SVG elements into Konva-compatible objects.
 * Used for legacy templates that don't have embedded Konva state JSON.
 */
export const parseSvgToElements = (svgString) => {
    if (!svgString) return [];

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return [];

        const elements = [];
        const children = Array.from(svg.children);

        children.forEach((child, index) => {
            const type = child.tagName.toLowerCase();
            const id = child.getAttribute('id') || `svg_el_${index}`;

            if (type === 'rect') {
                elements.push({
                    id,
                    type: 'rect',
                    x: parseFloat(child.getAttribute('x') || 0),
                    y: parseFloat(child.getAttribute('y') || 0),
                    width: parseFloat(child.getAttribute('width') || 0),
                    height: parseFloat(child.getAttribute('height') || 0),
                    fill: child.getAttribute('fill') || '#000000',
                    stroke: child.getAttribute('stroke'),
                    strokeWidth: parseFloat(child.getAttribute('stroke-width') || 0),
                    opacity: parseFloat(child.getAttribute('opacity') || 1),
                });
            } else if (type === 'text') {
                elements.push({
                    id,
                    type: 'text',
                    x: parseFloat(child.getAttribute('x') || 0),
                    y: parseFloat(child.getAttribute('y') || 0),
                    text: child.textContent.trim(),
                    fontSize: parseFloat(child.getAttribute('font-size') || 16),
                    fontFamily: child.getAttribute('font-family') || 'Arial',
                    fill: child.getAttribute('fill') || '#000000',
                    align: child.getAttribute('text-anchor') === 'middle' ? 'center' : 'left',
                    opacity: parseFloat(child.getAttribute('opacity') || 1),
                });
            } else if (type === 'circle') {
                elements.push({
                    id,
                    type: 'circle',
                    x: parseFloat(child.getAttribute('cx') || 0),
                    y: parseFloat(child.getAttribute('cy') || 0),
                    radius: parseFloat(child.getAttribute('r') || 0),
                    fill: child.getAttribute('fill') || '#000000',
                    stroke: child.getAttribute('stroke'),
                    strokeWidth: parseFloat(child.getAttribute('stroke-width') || 0),
                    opacity: parseFloat(child.getAttribute('opacity') || 1),
                });
            } else if (type === 'image') {
                elements.push({
                    id,
                    type: 'image',
                    x: parseFloat(child.getAttribute('x') || 0),
                    y: parseFloat(child.getAttribute('y') || 0),
                    width: parseFloat(child.getAttribute('width') || 0),
                    height: parseFloat(child.getAttribute('height') || 0),
                    src: child.getAttribute('href') || child.getAttribute('xlink:href'),
                    opacity: parseFloat(child.getAttribute('opacity') || 1),
                });
            }
        });

        return elements;
    } catch (e) {
        console.error('Error parsing SVG to elements:', e);
        return [];
    }
};
