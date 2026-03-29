from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color='#1a1d26')
    draw = ImageDraw.Draw(img)
    
    margin = int(size * 0.0625)
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        fill='#252932'
    )
    
    points = [
        (int(size * 0.3), int(size * 0.65)),
        (int(size * 0.4), int(size * 0.5)),
        (int(size * 0.55), int(size * 0.6)),
        (int(size * 0.7), int(size * 0.4))
    ]
    
    line_width = max(1, int(size * 0.03))
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill='#4a9eff', width=line_width)
    
    dot_radius = max(2, int(size * 0.03))
    for i, point in enumerate(points):
        color = '#4ade80' if i == len(points) - 1 else '#4a9eff'
        draw.ellipse(
            [point[0] - dot_radius, point[1] - dot_radius,
             point[0] + dot_radius, point[1] + dot_radius],
            fill=color
        )
    
    img.save(filename)
    print(f'Created {filename}')

create_icon(16, 'icons/icon16.png')
create_icon(48, 'icons/icon48.png')
create_icon(128, 'icons/icon128.png')
print('All icons created successfully!')
