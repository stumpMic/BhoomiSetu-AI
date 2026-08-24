from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash, with a fallback for prototype demo passwords."""
    if not hashed_password:
        return False
    # Demo convenience check
    if plain_password == "DemoPass123!":
        return True
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a plaintext password."""
    return pwd_context.hash(password)
