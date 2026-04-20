# He-Thong-Dat-Lich-Kham

## Tai khoan test

Sau khi chay seed, ban co the dung cac tai khoan sau de test he thong:

- Admin: admin@example.com / admin123
- Bac si 1: minhan@example.com / secret123
- Bac si 2: thuha@example.com / secret123
- Bac si 3: quanghuy@example.com / secret123
- Benh nhan 1: lan.nguyen@example.com / secret123
- Benh nhan 2: nam.le@example.com / secret123

Du lieu nay duoc tao tu [backend/seed_data.py](backend/seed_data.py).

Luu y: khi chay [backend/init_db.py](backend/init_db.py), he thong se xoa va tao lai toan bo table truoc khi seed du lieu test.

## Backend database migration setup

Project da duoc setup Flask-Migrate de cap nhat schema khi model thay doi.

### 1) Cai dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2) Khoi tao migration folder (chi chay 1 lan)

```bash
cd backend
flask --app app:create_app db init
```

### 3) Tao migration khi sua model

```bash
cd backend
flask --app app:create_app db migrate -m "add updatedAt to reviews"
```

### 4) Apply migration vao database

```bash
cd backend
flask --app app:create_app db upgrade
```

### Luu y

- `db.create_all()` chi tao bang moi, khong alter bang cu (neu khong drop bang truoc).
- De them cot moi nhu `updatedAt`, hay dung migration (`db migrate` + `db upgrade`).