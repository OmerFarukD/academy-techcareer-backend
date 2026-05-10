import asyncio
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal
from app.categories.model import Category
from app.products.model import Product
from app.roles.model import Role
from app.users.model import User
from app.product_images.model import ProductImage
from app.cart.model import Cart, CartItem
from app.orders.model import Order, OrderItem

# Gerçekçi 10 e-ticaret kategorisi
CATEGORIES = [
    "Elektronik",
    "Bilgisayar & Bilişim",
    "Cep Telefonu & Aksesuar",
    "Ev & Yaşam",
    "Giyim & Moda",
    "Kozmetik & Kişisel Bakım",
    "Spor & Outdoor",
    "Kitap, Müzik & Film",
    "Otomobil & Motosiklet",
    "Süpermarket & Gıda"
]

async def seed_categories():
    async with AsyncSessionLocal() as session:
        print("Kategoriler ekleniyor...")
        added_count = 0
        
        for cat_name in CATEGORIES:
            # Kategori veritabanında var mı kontrol edelim
            query = select(Category).where(Category.name == cat_name)
            result = await session.execute(query)
            existing_category = result.scalar_one_or_none()
            
            if not existing_category:
                new_category = Category(name=cat_name)
                session.add(new_category)
                added_count += 1
            else:
                print(f"'{cat_name}' zaten mevcut, atlanıyor.")
                
        # Değişiklikleri kaydet
        await session.commit()
        print(f"İşlem tamamlandı! {added_count} yeni kategori eklendi.")

if __name__ == "__main__":
    asyncio.run(seed_categories())
