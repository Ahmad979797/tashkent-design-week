# Инструкция по размещению Tashkent Design Week онлайн (24/7)

Проект полностью подготовлен для развертывания в облаке с сохранением всех внесенных изменений и загруженных файлов.

---

## 1. Загрузка кода на GitHub

1. Откройте [github.com/new](https://github.com/new) и создайте новый репозиторий (например, `tashkent-design-week`). Сделайте его **Public** или **Private**.
2. В терминале выполните команды (замените `YOUR_USERNAME` на ваш логин GitHub):

```bash
git remote add origin https://github.com/YOUR_USERNAME/tashkent-design-week.git
git branch -M main
git push -u origin main
```

---

## 2. Развертывание на Railway.app (Рекомендуемый вариант)

Railway идеально подходит для приложений с постоянным хранилищем (Volume):

1. Перейдите на [railway.app](https://railway.app) и войдите через GitHub.
2. Нажмите **"New Project"** → **"Deploy from GitHub repo"** и выберите ваш репозиторий `tashkent-design-week`.
3. После создания сервиса нажмите на него:
   * **Добавление постоянного диска (Volume):**
     * Перейдите во вкладку **Settings** или нажмите **+ New** внутри проекта → выберите **Volume**.
     * Привяжите Volume к вашему сервису и укажите **Mount Path:** `/storage`.
   * **Переменные окружения (Variables):**
     * Перейдите во вкладку **Variables** и добавьте:
       * `STORAGE_DIR` = `/storage`
       * `ADMIN_USER` = `admin` (или ваш логин)
       * `ADMIN_PASSWORD` = `ваш_надежный_пароль`
   * **Публичный адрес:**
     * Во вкладке **Settings** в блоке **Networking** нажмите **"Generate Domain"** (или укажите собственный домен).
4. Сервис соберется за 30 секунд. Вы получите публичную ссылку `https://...up.railway.app`.

Все изменения, которые вы и ваши коллеги будете вносить через `/admin`, будут надежно сохраняться в `/storage` и не пропадут при перезапусках.

---

## 3. Развертывание на Render.com

1. Перейдите на [render.com](https://render.com) и войдите через GitHub.
2. Нажмите **"New"** → **"Web Service"**.
3. Выберите ваш репозиторий GitHub.
4. Настройки:
   * **Name:** `tashkent-design-week`
   * **Environment:** `Node`
   * **Build Command:** (оставить пустым)
   * **Start Command:** `node server.js`
   * **Environment Variables:**
     * `ADMIN_USER`: `admin`
     * `ADMIN_PASSWORD`: `ваш_пароль`
     * `STORAGE_DIR`: `/var/data` (при подключении Disks)
5. Нажмите **"Create Web Service"**.

---

## 4. Как заходить в админку удаленно

* Публичный адрес: `https://ваш-домен/admin`
* Логин и пароль: те, что вы указали в переменных окружения (`ADMIN_USER` и `ADMIN_PASSWORD`).
