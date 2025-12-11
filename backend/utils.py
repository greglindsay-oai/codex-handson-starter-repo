from openai import OpenAI
import dotenv
import base64
import io

dotenv.load_dotenv()

client = OpenAI()

def create_image(prompt: str, 
                 size: str ="1024x1024"):
    """
    Create an image from a text prompt based on the given size with OpenAI's image-gen-1 model.
    
    Args:
        prompt (str): The text prompt to generate the image.
        size (str): The size of the generated image. Defaults to "1024x1024". Supported values are
            "1024x1024", "1792x1024", or "1024x1792".
    
    Returns:
        image_bytes: The generated image in bytes.
    """
    img = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        n=1,
        size=size
    )
    image_bytes = base64.b64decode(img.data[0].b64_json)
    return image_bytes

def edit_image(prompt, image_bytes):
    """
    Create an edited image based on the given prompt and input images using OpenAI's image-gen-1 model.
    
    Args:
        prompt (str): The text prompt to edit the image.
        image_bytes (bytes): The input image in bytes.
    Returns:
        image_bytes: The edited image in bytes.
    """
    image_file = io.BytesIO(image_bytes)
    image_file.name = "image.png"  # give the buffer a filename so the API infers image/png
    image_file.seek(0)

    result = client.images.edit(
        model="gpt-image-1",
        image=image_file,
        prompt=prompt
    )
    
    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    return image_bytes  
