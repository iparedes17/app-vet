# 🐾 PetFlow - Panel SuperAdmin

Panel de administración completo con diseño neumórfico profesional y botones redondeados.

## 📦 Estructura del Proyecto

```
petflow/
├── src/
│   ├── main.jsx
│   └── PetFlow.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Instalación

### 1. Organiza los archivos:
- Crea una carpeta llamada `src`
- Mueve `main.jsx` y `PetFlow.jsx` dentro de `src/`
- Deja el resto de archivos en la raíz

### 2. Instala dependencias:
```bash
npm install
```

### 3. Ejecuta la aplicación:
```bash
npm run dev
```

La app se abrirá en: `http://localhost:3000`

## 🔑 Credenciales

**SuperAdmin:**
- Email: `superadmin@petflow.io`
- Password: `super123`

## ✨ Funcionalidades del Panel SuperAdmin

### ✅ Gestión de Empresas
- Crear empresas con: nombre, NIT, teléfono, email, dirección
- Configurar notificaciones push por empresa (5 tipos)
- Editar empresas existentes
- Eliminar empresas

### ✅ Gestión de Sedes
- Crear sedes asociadas a empresas
- Datos: nombre, empresa, dirección, teléfono
- Editar y eliminar sedes

### ✅ Gestión de Usuarios Admin
- Crear admins para cada empresa (NO superadmins)
- Asignar a empresa específica
- Asignar a sede específica (opcional)
- Datos: nombre, email, password, empresa, sede

### ✅ Gestión de Clientes
- Crear clientes para cada empresa
- Datos: nombres, apellidos, celular, email
- Clientes pueden crear sus mascotas desde su perfil

### ✅ Notificaciones Configurables por Empresa
- Recordatorios de cumpleaños
- Día del perro (21 julio)
- Día del gato (8 agosto)
- Recordatorios de vacunas
- Confirmaciones de citas

## 🎨 Diseño

- ✅ **Botones completamente redondeados** (border-radius: 20px)
- ✅ **Sin bordes puntiagudos** en ningún elemento
- ✅ **Neumorfismo premium** con sombras suaves
- ✅ **Colores profesionales** (Indigo, Emerald, Rose)
- ✅ **100% responsivo**

## 📝 Notas Importantes

1. **Los clientes crean sus mascotas** desde su propio perfil (no desde el panel admin)
2. **Las notificaciones se configuran por empresa** (no globalmente)
3. **Cada admin solo administra su empresa** (no tiene acceso a otras)
4. **El diseño usa botones redondeados** en todos lados

## 🛠️ Tecnologías

- React 18
- Vite
- CSS-in-JS con diseño neumórfico
- Sin dependencias externas adicionales

---

**¡Listo para usar!** 🎉
