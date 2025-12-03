from PIL import Image
import os

def pixelise_image(image: Image.Image, reduction_factor: float) -> Image.Image:
    if not (0.1 <= reduction_factor <= 1.0):
        raise ValueError("Le taux de pixelisation doit être entre 0.1 et 1.0")
    w, h = image.size
    reduced_size = (max(1, int(w * reduction_factor)), max(1, int(h * reduction_factor)))
    return image.resize(reduced_size, Image.NEAREST).resize((w, h), Image.NEAREST)

# --- Paramètres ---
source_path = "/Users/dregaldi/Desktop/PxlZer/Deftones-KnifeParty.png"

# --- Extraire le nom du fichier sans extension ---
source_name = os.path.splitext(os.path.basename(source_path))[0]
print("Nom de la source :", source_name)

# --- Ouvrir l'image ---
img = Image.open(source_path)
width, height = img.size

# === 600x600 : crop en haut + carré ===
crop_top_ratio_600 = 0.025
crop_top_600 = int(height * crop_top_ratio_600)
remaining_img_600 = img.crop((0, crop_top_600, width, height))
remaining_height_600 = height - crop_top_600

crop_size = min(width, remaining_height_600)
left_600 = (width - crop_size) // 2
final_crop_600 = remaining_img_600.crop((left_600, 0, left_600 + crop_size, crop_size))
img_600 = final_crop_600.resize((600, 600), Image.LANCZOS)
pixel_600 = pixelise_image(img_600, 0.2) #0.2

# Enregistrement automatique avec nom source
output_600 = f"{source_name}-600x600.png"
pixel_600.save(output_600, "PNG")
print(f"Image enregistrée : {output_600}")

# === 1280x720 : 4.5% haut + réduction des marges latérales ===
crop_top_ratio_720 = 0.0251
margin_reduction_ratio = 1.0

crop_top_720 = int(height * crop_top_ratio_720)
remaining_img_720 = img.crop((0, crop_top_720, width, height))
remaining_height_720 = height - crop_top_720
remaining_width_720 = width

# --- Réduction des marges latérales ---
margin_reduction = 1.0 - margin_reduction_ratio
left_margin = int(remaining_width_720 * margin_reduction / 2)
right_margin = int(remaining_width_720 * margin_reduction / 2)
new_width = remaining_width_720 - left_margin - right_margin

remaining_img_720 = remaining_img_720.crop((left_margin, 0, left_margin + new_width, remaining_height_720))
remaining_width_720 = new_width

# --- Crop 16:9 centré ---
target_ratio_720 = 1280 / 720
crop_width_720 = remaining_width_720
crop_height_720 = int(crop_width_720 / target_ratio_720)

if crop_height_720 > remaining_height_720:
    crop_height_720 = remaining_height_720
    crop_width_720 = int(crop_height_720 * target_ratio_720)

left_720 = (remaining_width_720 - crop_width_720) // 2
final_crop_720 = remaining_img_720.crop((left_720, 0, left_720 + crop_width_720, crop_height_720))
img_720 = final_crop_720.resize((1280, 720), Image.LANCZOS)
pixel_720 = pixelise_image(img_720, 0.17) #0.2

# Enregistrement automatique avec nom source
output_720 = f"{source_name}-1280x720.png"
pixel_720.save(output_720, "PNG")
print(f"Image enregistrée : {output_720}")
# === Réduction de 75% (Taille originale * 0.25) ===
small_width = int(width * 0.25)
small_height = int(height * 0.25)
img_small = img.resize((small_width, small_height), Image.LANCZOS)

output_small = f"{source_name}-Small.png"
img_small.save(output_small, "PNG")
print(f"Image enregistrée : {output_small}")
