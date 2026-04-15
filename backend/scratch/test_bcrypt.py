import bcrypt
import hashlib

def _get_password_hash(password: str) -> str:
    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_hash.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def _verify_password(password: str, hashed_password: str) -> bool:
    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return bcrypt.checkpw(pw_hash.encode("utf-8"), hashed_password.encode("utf-8"))

password = "a_very_long_password_that_is_definitely_longer_than_seventy_two_characters_to_test_the_new_sha256_prehashing_logic_which_should_work_perfectly_now"
hashed = _get_password_hash(password)
print(f"Hashed: {hashed}")
verified = _verify_password(password, hashed)
print(f"Verified: {verified}")

short_password = "short"
hashed_short = _get_password_hash(short_password)
print(f"Hashed Short: {hashed_short}")
verified_short = _verify_password(short_password, hashed_short)
print(f"Verified Short: {verified_short}")
