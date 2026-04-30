import { useState, useEffect, useRef } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { firestoreDb } from "./firebase";
import emailjs from "@emailjs/browser";

const DB_REF = doc(firestoreDb, "petflow", "state");

// Coloca tu imagen en public/logo.png (o cambia la ruta aquí)
const LOGO_SRC = "/logo.png";

const LogoImg = ({ size = 32 }) => {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, color: T.primary }}><svg width={size * 0.75} height={size * 0.75} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg></span>;
  return <img src={LOGO_SRC} alt="logo" width={size} height={size} style={{ objectFit: "contain", display: "block", borderRadius: size * 0.15 }} onError={() => setErr(true)} />;
};

const useIsMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
};

const T = {
  bg: "#e8ecf1", surface: "#f0f4f8",
  nmOut: "12px 12px 24px #c5cdd8, -12px -12px 24px #ffffff",
  nmIn: "inset 6px 6px 16px #c5cdd8, inset -6px -6px 16px #ffffff",
  nmSm: "6px 6px 14px #c5cdd8, -6px -6px 14px #ffffff",
  nmHover: "14px 14px 28px #c5cdd8, -14px -14px 28px #ffffff",
  primary: "#3f8fb0", primaryLight: "#6ab8ce",
  emerald: "#10b981", rose: "#f43f5e", roseDark: "#e11d48",
  tx1: "#1e293b", tx2: "#475569", tx3: "#94a3b8",
};

const DEFAULT_EMAIL_TEMPLATES = {
  // → Cliente
  cumpleanos:        { subject: "🎂 ¡Hoy cumple años {mascota}!",              body: "Hola {cliente}, tu mascota {mascota} ({especie}) está de cumpleaños hoy. ¡Felicítala! 🎉" },
  vacunas:           { subject: "💉 Próxima dosis: {medicamento}",              body: "Hola, {mascota} necesita {medicamento} el {proximaDosis}. Por favor agenda una cita." },
  vacunasVencida:    { subject: "⚠️ Dosis vencida: {medicamento}",              body: "La dosis de {medicamento} para {mascota} venció el {proximaDosis}. ¡Agenda una cita pronto!" },
  diaPerro:          { subject: "🐶 ¡Hoy es el Día del Perro!",                 body: "Hoy, 21 de julio, celebramos a todos los perros del mundo. ¡Dales mucho amor! 🐾" },
  diaGato:           { subject: "🐱 ¡Hoy es el Día Internacional del Gato!",    body: "Hoy, 8 de agosto, es el día de los felinos. ¡Mímalos con sus snacks favoritos! 😺" },
  diasEspeciales:    { subject: "🌍 Día Mundial de los Animales",                body: "Hoy, 4 de octubre, honramos a todos los animales. ¡Abraza a tu mascota! 🐾" },
  citaConfirmada:    { subject: "✅ Tu cita fue confirmada",                      body: "Hola {cliente}, tu cita del {fecha} a las {hora} ({motivo}) ha sido confirmada. ¡Te esperamos!" },
  citaCancelada:     { subject: "❌ Tu cita fue cancelada",                       body: "Hola {cliente}, tu cita del {fecha} a las {hora} ({motivo}) fue cancelada. Por favor reagenda cuando gustes." },
  citaReprogramada:  { subject: "📅 Tu cita fue reprogramada",                    body: "Hola {cliente}, tu cita ha sido reprogramada para el {fecha} a las {hora} ({motivo}). ¡Te esperamos!" },
  recordatorioMed:   { subject: "💊 Recordatorio: {medicamento}",                body: "{medicamento}{dosis} programado a las {hora} para {mascota} no fue marcado como administrado." },
  // → Veterinaria
  diaVeterinario:    { subject: "🩺 ¡Feliz Día del Veterinario!",                body: "Hoy, 7 de junio, celebramos a quienes dedican su vida al cuidado de los animales. ¡Gracias por su labor!" },
  citaNueva:         { subject: "📅 Nueva cita solicitada",                       body: "{cliente} agendó una cita para el {fecha} a las {hora}: {motivo}." },
  citaCanceladaVet:  { subject: "❌ Cita cancelada — aviso al equipo",            body: "La cita de {cliente} del {fecha} a las {hora} ({motivo}) fue cancelada." },
  citaReprogramadaVet: { subject: "📅 Cita reprogramada — aviso al equipo",      body: "La cita de {cliente} fue reprogramada para el {fecha} a las {hora} ({motivo})." },
  vacunasVencidaVet: { subject: "⚠️ Dosis vencida en paciente: {mascota}",       body: "{mascota} (cliente: {cliente}) tiene la dosis de {medicamento} vencida desde el {proximaDosis}. Considera contactar al cliente." },
};

const EMAIL_TEMPLATE_META = [
  // Al cliente
  { key: "cumpleanos",       label: "Cumpleaños de mascota",         vars: "{mascota}  {especie}  {cliente}",              dest: "Cliente"     },
  { key: "vacunas",          label: "Vacuna próxima (≤30 días)",     vars: "{mascota}  {medicamento}  {proximaDosis}",      dest: "Cliente"     },
  { key: "vacunasVencida",   label: "Vacuna vencida",                vars: "{mascota}  {medicamento}  {proximaDosis}",      dest: "Cliente"     },
  { key: "diaPerro",         label: "Día del Perro (21 Jul)",        vars: "—",                                             dest: "Cliente"     },
  { key: "diaGato",          label: "Día del Gato (8 Ago)",          vars: "—",                                             dest: "Cliente"     },
  { key: "diasEspeciales",   label: "Día Mundial Animales (4 Oct)",  vars: "—",                                             dest: "Cliente"     },
  { key: "citaConfirmada",   label: "Cita confirmada",               vars: "{cliente}  {fecha}  {hora}  {motivo}",          dest: "Cliente"     },
  { key: "citaCancelada",    label: "Cita cancelada",                vars: "{cliente}  {fecha}  {hora}  {motivo}",          dest: "Cliente"     },
  { key: "citaReprogramada", label: "Cita reprogramada",             vars: "{cliente}  {fecha}  {hora}  {motivo}",          dest: "Cliente"     },
  { key: "recordatorioMed",  label: "Recordatorio medicamento",      vars: "{medicamento}  {dosis}  {hora}  {mascota}",     dest: "Cliente"     },
  // A la veterinaria
  { key: "diaVeterinario",   label: "Día del Veterinario (7 Jun)",   vars: "—",                                             dest: "Veterinaria" },
  { key: "citaNueva",        label: "Nueva cita del cliente",        vars: "{cliente}  {fecha}  {hora}  {motivo}",          dest: "Veterinaria" },
  { key: "citaCanceladaVet",    label: "Cita cancelada (aviso equipo)",    vars: "{cliente}  {fecha}  {hora}  {motivo}",  dest: "Veterinaria" },
  { key: "citaReprogramadaVet", label: "Cita reprogramada (aviso equipo)", vars: "{cliente}  {fecha}  {hora}  {motivo}",  dest: "Veterinaria" },
  { key: "vacunasVencidaVet",label: "Vacuna vencida (aviso equipo)", vars: "{mascota}  {cliente}  {medicamento}  {proximaDosis}", dest: "Veterinaria" },
];

const NOTIF_TYPES = [
  { key: "cumpleanos",      iconKey: "cake",    label: "Cumpleaños de mascotas",        desc: "El día del cumpleaños de cada mascota" },
  { key: "vacunas",         iconKey: "vacunas", label: "Vacunas pendientes",             desc: "30 días antes del vencimiento" },
  { key: "citas",           iconKey: "citas",   label: "Confirmación de citas",          desc: "Al confirmar, completar o cancelar" },
  { key: "diaPerro",        iconKey: "dog",     label: "Día del Perro (21 Jul)",         desc: "Notificación al cliente" },
  { key: "diaGato",         iconKey: "cat",     label: "Día del Gato (8 Ago)",           desc: "Notificación al cliente" },
  { key: "diaVeterinario",  iconKey: "admins",  label: "Día del Veterinario (7 Jun)",    desc: "Recordatorio a la veterinaria" },
  { key: "recordatorioMed", iconKey: "pill",    label: "Recordatorio de medicamentos",   desc: "Dosis no marcadas como administradas" },
  { key: "diasEspeciales",  iconKey: "globe",   label: "Día Mundial Animales (4 Oct)",   desc: "Notificación al cliente" },
];

const COL_TZ  = "America/Bogota";
const colDate = () => new Date().toLocaleDateString("en-CA", { timeZone: COL_TZ });
const colTime = () => new Date().toLocaleTimeString("en-GB", { timeZone: COL_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const colMes  = () => colDate().slice(0, 7);

const initPush = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("/sw.js"); } catch (_) {}
};

const sendPush = async (title, body, tag = "petflow") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, { body, icon: "/logo.png", badge: "/logo.png", tag, vibrate: [100, 50, 100] });
    } else {
      new Notification(title, { body, icon: "/logo.png", tag });
    }
  } catch (_) {}
};

const pushAlreadySent = (key) => {
  const today = colDate();
  try {
    const stored = JSON.parse(localStorage.getItem("petflow_pushes") || "{}");
    return !!stored[`${key}_${today}`];
  } catch { return false; }
};

const markPushSent = (key) => {
  const today = colDate();
  try {
    const stored = JSON.parse(localStorage.getItem("petflow_pushes") || "{}");
    const cutoffStr = new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-CA", { timeZone: COL_TZ });
    const cleaned = Object.fromEntries(Object.entries(stored).filter(([k]) => (k.split("_").pop() || "") >= cutoffStr));
    cleaned[`${key}_${today}`] = 1;
    localStorage.setItem("petflow_pushes", JSON.stringify(cleaned));
  } catch {}
};

const emailAlreadySent = (key) => pushAlreadySent(`em_${key}`);
const markEmailSent    = (key) => markPushSent(`em_${key}`);

const sendEmail = async (cfg, to, subject, message) => {
  if (!cfg?.serviceId || !cfg?.templateId || !cfg?.publicKey || !to) return;
  try {
    await emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email:  to,
      subject,
      message,
      from_name: cfg.fromName || "Voff App",
    }, cfg.publicKey);
  } catch (e) { console.error("EmailJS error:", e); }
};

const applyTemplate = (tpl = "", vars = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v ?? ""), tpl);

const sendEmailTpl = (cfg, to, tplKey, vars = {}) => {
  const tpl     = { ...DEFAULT_EMAIL_TEMPLATES[tplKey], ...(cfg?.templates?.[tplKey] || {}) };
  const subject = applyTemplate(tpl.subject || tplKey, vars);
  const body    = applyTemplate(tpl.body    || "",     vars);
  sendEmail(cfg, to, subject, body);
};

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const INITIAL_DB = {
  users: { superadmin: { id: "sa", email: "superadmin@petflow.io", password: "super123", role: "superadmin" } },
  empresas: {
    emp_001: { id: "emp_001", nombre: "Veterinaria San Francisco", nit: "900123456-1", telefono: "+57 300 123 4567", email: "contacto@sanfrancisco.com", direccion: "Calle 45 #23-10, Bogotá", notificaciones: { cumpleanos: true, diaPerro: true, diaGato: false, vacunas: true, citas: true, recordatorioMed: true, diasEspeciales: true, diaVeterinario: true, emailEnabled: false, notifEmail: "" } },
  },
  sedes: {
    sede_001: { id: "sede_001", empresaId: "emp_001", nombre: "Sede Principal", direccion: "Calle 45 #23-10, Bogotá", telefono: "+57 300 123 4567", horarios: [
      { dia: "Lunes",     abre: "08:00", cierra: "18:00", activo: true  },
      { dia: "Martes",    abre: "08:00", cierra: "18:00", activo: true  },
      { dia: "Miércoles", abre: "08:00", cierra: "18:00", activo: true  },
      { dia: "Jueves",    abre: "08:00", cierra: "18:00", activo: true  },
      { dia: "Viernes",   abre: "08:00", cierra: "18:00", activo: true  },
      { dia: "Sábado",    abre: "09:00", cierra: "14:00", activo: true  },
      { dia: "Domingo",   abre: "",      cierra: "",      activo: false },
    ]},
  },
  adminUsers: {
    admin_001: { id: "admin_001", nombre: "Carlos Rodríguez", email: "carlos@sanfrancisco.com", password: "Admin@123", empresaId: "emp_001", sedeId: "sede_001", role: "admin" },
  },
  clientes: {
    cli_001: { id: "cli_001", nombres: "María", apellidos: "González López", celular: "+57 315 987 6543", email: "maria.gonzalez@gmail.com", empresaId: "emp_001", sedeId: "sede_001", password: "Cliente@1", role: "cliente", mascotas: ["masc_001"] },
  },
  mascotas: {
    masc_001: { id: "masc_001", clienteId: "cli_001", empresaId: "emp_001", nombre: "Mishi", especie: "Gato", raza: "Persa", genero: "Hembra", edad: 3, fechaCumpleanos: "2021-06-14", foto: null },
  },
  citas: {
    cita_001: { id: "cita_001", clienteId: "cli_001", mascotaId: "masc_001", empresaId: "emp_001", sedeId: "sede_001", fecha: "2026-05-10", hora: "10:00", motivo: "Vacunación anual", estado: "confirmada" },
    cita_002: { id: "cita_002", clienteId: "cli_001", mascotaId: "masc_001", empresaId: "emp_001", sedeId: "sede_001", fecha: "2026-04-02", hora: "09:30", motivo: "Consulta general", estado: "completada" },
  },
  historialMedico: {
    hist_001: { id: "hist_001", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", fecha: "2026-04-02", tipo: "Consulta", descripcion: "Consulta general de rutina", veterinario: "Dr. Pérez", diagnostico: "Saludable, sin anomalías", tratamientos: ["Suplementación vitamínica"], medicamentos: [{ nombre: "Vitamina B12 (Perros y Gatos)", dosis: "1 ampolla IM", frecuencia: "Una vez al día", duracion: "7 días" }], notas: "Próximo control en 6 meses.", peso: "4.2 kg" },
    hist_002: { id: "hist_002", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", fecha: "2026-01-15", tipo: "Vacuna", descripcion: "Triple felina + rabia", veterinario: "Dr. Pérez", diagnostico: "Preventivo", tratamientos: ["Vacunación"], medicamentos: [], notas: "", peso: "4.0 kg" },
    hist_003: { id: "hist_003", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", fecha: "2025-09-20", tipo: "Cirugía", descripcion: "Esterilización", veterinario: "Dra. López", diagnostico: "Procedimiento exitoso", tratamientos: ["Cirugía (Perros y Gatos)", "Reposo (Perros y Gatos)"], medicamentos: [{ nombre: "Amoxicilina (Perros y Gatos)", dosis: "250mg — 1 cápsula", frecuencia: "Cada 12 horas", duracion: "7 días" }, { nombre: "Meloxicam (Perros y Gatos)", dosis: "0.5ml", frecuencia: "Una vez al día", duracion: "3 días" }], notas: "Usar collar isabelino hasta retirar puntos.", peso: "3.9 kg" },
  },
  ajustes: {
    email: { serviceId: "", templateId: "", publicKey: "", fromName: "Voff App" },
    tratamientos: [
      "Antibioticoterapia (Perros y Gatos)", "Desparasitación interna (Perros y Gatos)", "Desparasitación externa (Perros y Gatos)",
      "Vacunación (Perros y Gatos)", "Fluidoterapia (Perros y Gatos)", "Reposo (Perros y Gatos)", "Dieta especial (Perros y Gatos)",
      "Cirugía general (Perros y Gatos)", "Fisioterapia (Perros)", "Quimioterapia (Perros y Gatos)",
      "Vacuna quíntuple (Perros)", "Vacuna séxtuple (Perros)", "Vacuna antirrábica (Perros y Gatos)",
      "Vacuna triple felina (Gatos)", "Vacuna leucemia felina (Gatos)",
      "Inmunoterapia alérgica (Perros)", "Limpieza dental (Perros y Gatos)", "Esterilización (Perros y Gatos)",
      "Tratamiento dermatológico (Perros)", "Tratamiento respiratorio (Gatos)",
    ],
    medicamentos: [
      "Amoxicilina (Perros y Gatos)", "Metronidazol (Perros y Gatos)", "Dexametasona (Perros y Gatos)",
      "Ivermectina (Perros y Gatos)", "Praziquantel (Perros y Gatos)", "Meloxicam (Perros y Gatos)",
      "Tramadol (Perros y Gatos)", "Omeprazol (Perros y Gatos)", "Vitamina B12 (Perros y Gatos)", "Suero fisiológico (Perros y Gatos)",
      "Enrofloxacina (Perros)", "Cefalexina (Perros)", "Prednisolona (Perros y Gatos)",
      "Atenolol (Gatos)", "Furosemida (Perros y Gatos)", "Interferon omega (Gatos)",
      "Maropitant (Perros y Gatos)", "Gabapentina (Perros y Gatos)", "Ciclosporina (Perros)", "Benazepril (Perros y Gatos)",
    ],
    motivosCitas: [
      "Control", "Vacuna", "Peluquería", "Consulta general", "Cirugía", "Desparasitación",
      "Urgencia", "Odontología", "Laboratorio", "Seguimiento",
    ],
  },
  notificaciones: {
    notif_001: { id: "notif_001", titulo: "Cumpleaños de Mishi", mensaje: "La mascota Mishi (Gato Persa) de María González cumple años el 14 de junio.", leida: false, fecha: "2026-04-27", tipo: "cumpleanos", empresaId: "emp_001" },
    notif_002: { id: "notif_002", titulo: "Cliente registrado", mensaje: "María González fue registrada en Veterinaria San Francisco.", leida: false, fecha: "2026-04-27", tipo: "general", empresaId: "emp_001" },
    notif_003: { id: "notif_003", titulo: "Vacuna pendiente", mensaje: "Mishi tiene una vacuna de refuerzo pendiente este mes.", leida: false, fecha: "2026-04-26", tipo: "vacuna", empresaId: "emp_001" },
  },
  medAdministrados: {},
  vacunas: {
    vac_001: { id: "vac_001", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", nombre: "Triple felina (Gatos)", tipo: "vacuna", fecha: "2026-01-15", proximaDosis: "2027-01-15", veterinario: "Dr. Pérez", lote: "TF-2026-01", notas: "" },
    vac_002: { id: "vac_002", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", nombre: "Antirrábica (Perros y Gatos)", tipo: "vacuna", fecha: "2026-01-15", proximaDosis: "2027-01-15", veterinario: "Dr. Pérez", lote: "AR-2026-01", notas: "" },
    vac_003: { id: "vac_003", mascotaId: "masc_001", clienteId: "cli_001", empresaId: "emp_001", nombre: "Desparasitación interna (Perros y Gatos)", tipo: "desparasitacion", fecha: "2026-02-01", proximaDosis: "2026-05-01", veterinario: "Dr. Pérez", lote: "", notas: "Producto: Milbemax" },
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${T.bg}; color: ${T.tx1}; font-family: 'Montserrat', sans-serif; -webkit-font-smoothing: antialiased; }
.card { background: ${T.surface}; border-radius: 24px; box-shadow: ${T.nmOut}; border: 1px solid rgba(255,255,255,0.6); transition: all 0.3s; }
.inset { background: linear-gradient(145deg, #e4e8ed, #f4f8fc); border-radius: 18px; box-shadow: ${T.nmIn}; border: 1px solid rgba(0,0,0,0.04); }
.btn, .btn-primary, .btn-success, .btn-danger { border-radius: 20px; border: 1px solid rgba(255,255,255,0.5); cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; padding: 12px 28px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.25s ease; white-space: nowrap; }
.btn, .btn-primary, .btn-success, .btn-danger { user-select: none; }
.btn { background: ${T.surface}; box-shadow: ${T.nmSm}; color: ${T.tx2}; }
.btn:hover { box-shadow: ${T.nmHover}; color: ${T.tx1}; transform: translateY(-2px); }
.btn:active { box-shadow: ${T.nmIn}; transform: translateY(0); }
.btn:disabled, .btn-primary:disabled, .btn-success:disabled, .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
.btn-primary { background: linear-gradient(135deg, ${T.primary}, ${T.primaryLight}); color: white; box-shadow: 6px 6px 16px rgba(63,143,176,0.4), -6px -6px 16px #ffffff; font-weight: 700; }
.btn-primary:hover { box-shadow: 10px 10px 24px rgba(63,143,176,0.5), -10px -10px 24px #ffffff; color: white; transform: translateY(-2px); }
.btn-primary:active { box-shadow: inset 4px 4px 10px rgba(25,70,90,0.45), inset -4px -4px 10px rgba(255,255,255,0.2); transform: translateY(0); }
.btn-success { background: linear-gradient(135deg, ${T.emerald}, #34d399); color: white; box-shadow: 6px 6px 16px rgba(16,185,129,0.4), -6px -6px 16px #ffffff; font-weight: 700; }
.btn-success:hover { box-shadow: 10px 10px 24px rgba(16,185,129,0.5), -10px -10px 24px #ffffff; color: white; transform: translateY(-2px); }
.btn-success:active { box-shadow: inset 4px 4px 10px rgba(5,100,65,0.45), inset -4px -4px 10px rgba(255,255,255,0.2); transform: translateY(0); }
.btn-danger { background: linear-gradient(135deg, ${T.rose}, ${T.roseDark}); color: white; box-shadow: 6px 6px 16px rgba(244,63,94,0.4), -6px -6px 16px #ffffff; font-weight: 700; }
.btn-danger:hover { box-shadow: 10px 10px 24px rgba(244,63,94,0.5), -10px -10px 24px #ffffff; color: white; transform: translateY(-2px); }
.btn-danger:active { box-shadow: inset 4px 4px 10px rgba(150,15,35,0.45), inset -4px -4px 10px rgba(255,255,255,0.2); transform: translateY(0); }
.input { background: linear-gradient(145deg, #e4e8ed, #f4f8fc); box-shadow: ${T.nmIn}; border: 1px solid rgba(0,0,0,0.04); border-radius: 16px; color: ${T.tx1}; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 500; padding: 14px 18px; width: 100%; outline: none; transition: all 0.3s; }
.input:focus { border-color: rgba(63,143,176,0.3); box-shadow: ${T.nmIn}, 0 0 0 4px rgba(63,143,176,0.12); background: #ffffff; }
.input::placeholder { color: ${T.tx3}; }
select.input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }
.badge { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; box-shadow: ${T.nmSm}; }
.badge-primary { background: rgba(63,143,176,0.12); color: ${T.primary}; border: 1px solid rgba(63,143,176,0.2); }
.badge-success { background: rgba(16,185,129,0.12); color: ${T.emerald}; border: 1px solid rgba(16,185,129,0.2); }
.toggle { position: relative; width: 52px; height: 28px; border-radius: 20px; cursor: pointer; }
.toggle-bg { position: absolute; inset: 0; border-radius: 20px; transition: all 0.4s; }
.toggle-handle { position: absolute; top: 3px; width: 22px; height: 22px; border-radius: 50%; background: white; box-shadow: 2px 2px 6px rgba(0,0,0,0.15); transition: all 0.4s; }
.modal-overlay { position: fixed; inset: 0; background: rgba(14,17,23,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-radius: 14px; cursor: pointer; transition: all 0.25s ease; font-weight: 600; font-size: 13.5px; color: ${T.tx3}; background: ${T.surface}; box-shadow: 4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff; border: 1px solid rgba(255,255,255,0.6); user-select: none; }
.nav-item:hover { box-shadow: 7px 7px 16px #c5cdd8, -7px -7px 16px #ffffff; color: ${T.tx2}; transform: translateY(-1px); }
.nav-item:active { box-shadow: inset 3px 3px 8px #c5cdd8, inset -3px -3px 8px #ffffff; transform: none; }
.nav-item-active { box-shadow: inset 4px 4px 10px #c5cdd8, inset -4px -4px 10px #ffffff !important; color: ${T.primary} !important; border-color: rgba(63,143,176,0.18) !important; transform: none !important; }
.nav-logout:hover { box-shadow: 6px 6px 14px rgba(244,63,94,0.22), -6px -6px 14px #ffffff !important; color: ${T.rose} !important; }
/* ── Grid helpers ── */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
.empresa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
/* ── Responsive ── */
@media (max-width: 767px) {
  .modal-overlay { align-items: flex-end !important; padding: 0 !important; }
  .modal-inner { border-radius: 28px 28px 0 0 !important; max-height: 93vh !important; max-width: 100% !important; padding: 22px 18px 34px !important; }
  .form-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .empresa-grid { grid-template-columns: 1fr; }
  .login-card { padding: 32px 22px !important; }
  .btn, .btn-primary, .btn-success, .btn-danger { padding: 11px 18px; font-size: 13px; }
  .input { padding: 12px 14px; }
  .badge { font-size: 11px; padding: 4px 10px; }
  .list-row { flex-wrap: wrap; gap: 10px !important; }
  .list-row-actions { flex-direction: row !important; }
  .horario-row { flex-wrap: wrap; gap: 8px !important; }
}
`;

const LBL = { fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 };

const PasswordHint = () => (
  <p style={{ fontSize: 11, color: T.tx3, marginTop: 6, fontWeight: 500, letterSpacing: "0.1px" }}>
    Mínimo una mayúscula y un carácter especial (!@#$%&*)
  </p>
);

const Toggle = ({ checked, onChange }) => (
  <div className="toggle" onClick={() => onChange(!checked)}>
    <div className="toggle-bg" style={{ background: checked ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : T.bg, boxShadow: checked ? `0 0 20px rgba(63,143,176,0.2), ${T.nmSm}` : T.nmIn }} />
    <div className="toggle-handle" style={{ left: checked ? "27px" : "3px" }} />
  </div>
);

const ModalEmpresa = ({ empresa, onSave, onClose }) => {
  const [form, setForm] = useState(empresa || { nombre: "", nit: "", telefono: "", email: "", direccion: "", notificaciones: { cumpleanos: true, diaPerro: true, diaGato: true, vacunas: true, citas: true, diaVeterinario: true, recordatorioMed: true, diasEspeciales: true } });
  const handleSave = () => { if (!form.nombre || !form.nit) { alert("Nombre y NIT son obligatorios"); return; } onSave(form); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 700, padding: 32, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.tx1 }}>{empresa ? "Editar Empresa" : "Nueva Empresa"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid" style={{ gap: 20, marginBottom: 24 }}>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>NOMBRE EMPRESA *</label><input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Veterinaria San Francisco" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>NIT *</label><input className="input" value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="123456789-0" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>TELÉFONO</label><input className="input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+57 300 123 4567" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMAIL</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>DIRECCIÓN</label><input className="input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 123 #45-67" /></div>
        </div>
        <div className="inset" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1 }}>Notificaciones Push</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setForm({ ...form, notificaciones: Object.fromEntries(NOTIF_TYPES.map(t => [t.key, true])) })}>Activar todo</button>
              <button className="btn" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setForm({ ...form, notificaciones: Object.fromEntries(NOTIF_TYPES.map(t => [t.key, false])) })}>Desactivar todo</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {NOTIF_TYPES.map(item => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: T.bg, boxShadow: "3px 3px 8px #c5cdd8, -3px -3px 8px #ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary, marginTop: 1 }}>{Icons[item.iconKey]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
                <Toggle checked={!!(form.notificaciones || {})[item.key]} onChange={v => setForm({ ...form, notificaciones: { ...(form.notificaciones || {}), [item.key]: v } })} />
              </div>
            ))}
          </div>
        </div>
        <div className="inset" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>Notificaciones por Correo</h3>
              <p style={{ fontSize: 11, color: T.tx3 }}>Usa los mismos tipos habilitados en Push. Requiere configurar EmailJS en Ajustes.</p>
            </div>
            <Toggle checked={!!(form.notificaciones?.emailEnabled)} onChange={v => setForm({ ...form, notificaciones: { ...(form.notificaciones || {}), emailEnabled: v } })} />
          </div>
          {form.notificaciones?.emailEnabled && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 6 }}>EMAIL QUE RECIBIRÁ LAS NOTIFICACIONES</label>
              <input className="input" type="email" value={form.notificaciones?.notifEmail || ""} onChange={e => setForm({ ...form, notificaciones: { ...(form.notificaciones || {}), notifEmail: e.target.value } })} placeholder="veterinaria@tudominio.com" />
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{empresa ? "Guardar Cambios" : "Crear Empresa"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalSede = ({ sede, empresas, onSave, onClose }) => {
  const horariosDefault = DIAS.map(dia => ({ dia, abre: dia === "Domingo" ? "" : "08:00", cierra: dia === "Domingo" ? "" : "18:00", activo: dia !== "Domingo" }));
  const [form, setForm] = useState(sede || { nombre: "", empresaId: "", direccion: "", telefono: "", horarios: horariosDefault });
  const handleSave = () => { if (!form.nombre || !form.empresaId) { alert("Nombre y Empresa son obligatorios"); return; } onSave(form); };
  const toggleDia = (index) => {
    const h = [...form.horarios];
    h[index].activo = !h[index].activo;
    if (!h[index].activo) { h[index].abre = ""; h[index].cierra = ""; } else { h[index].abre = "08:00"; h[index].cierra = "18:00"; }
    setForm({ ...form, horarios: h });
  };
  const updateHorario = (index, field, value) => { const h = [...form.horarios]; h[index][field] = value; setForm({ ...form, horarios: h }); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 700, padding: 32, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.tx1 }}>{sede ? "Editar Sede" : "Nueva Sede"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>NOMBRE SEDE *</label><input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Sede Norte" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMPRESA *</label><select className="input" value={form.empresaId} onChange={e => setForm({ ...form, empresaId: e.target.value })}><option value="">Seleccionar empresa...</option>{Object.values(empresas).map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}</select></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>DIRECCIÓN</label><input className="input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 123 #45-67" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>TELÉFONO</label><input className="input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+57 300 123 4567" /></div>
        </div>
        <div className="inset" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 16 }}>Horarios de Atención</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {form.horarios.map((h, i) => (
              <div key={h.dia} className="horario-row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: 14 }}>
                <div style={{ width: 100, fontWeight: 600, fontSize: 14, color: T.tx1 }}>{h.dia}</div>
                <input className="input" type="time" value={h.abre} onChange={e => updateHorario(i, "abre", e.target.value)} disabled={!h.activo} style={{ flex: 1, fontSize: 13 }} />
                <span style={{ color: T.tx3 }}>—</span>
                <input className="input" type="time" value={h.cierra} onChange={e => updateHorario(i, "cierra", e.target.value)} disabled={!h.activo} style={{ flex: 1, fontSize: 13 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={h.activo} onChange={() => toggleDia(i)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: T.tx2, fontWeight: 600 }}>Activo</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{sede ? "Guardar Cambios" : "Crear Sede"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalUsuarioAdmin = ({ usuario, empresas, sedes, onSave, onClose }) => {
  const [form, setForm] = useState(usuario || { nombre: "", email: "", password: "", empresaId: "", sedeId: "" });
  const sedesFiltradas = Object.values(sedes).filter(s => s.empresaId === form.empresaId);
  const handleSave = () => { if (!form.nombre || !form.email || !form.empresaId || (!usuario && !form.password)) { alert("Complete todos los campos obligatorios"); return; } onSave(form); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 600, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.tx1 }}>{usuario ? "Editar Admin" : "Nuevo Admin"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>NOMBRE COMPLETO *</label><input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Juan Pérez" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMAIL *</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@empresa.com" /></div>
          {!usuario && <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>CONTRASEÑA *</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /><PasswordHint /></div>}
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMPRESA *</label><select className="input" value={form.empresaId} onChange={e => setForm({ ...form, empresaId: e.target.value, sedeId: "" })}><option value="">Seleccionar empresa...</option>{Object.values(empresas).map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}</select></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>SEDE</label><select className="input" value={form.sedeId} onChange={e => setForm({ ...form, sedeId: e.target.value })} disabled={!form.empresaId}><option value="">Todas las sedes</option>{sedesFiltradas.map(sede => <option key={sede.id} value={sede.id}>{sede.nombre}</option>)}</select></div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{usuario ? "Guardar Cambios" : "Crear Admin"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalSuperAdminUser = ({ sa, onSave, onClose }) => {
  const [form, setForm] = useState(sa || { nombre: "", email: "", password: "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.nombre || !form.email || (!sa && !form.password)) { alert("Nombre, email y contraseña son obligatorios"); return; }
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.tx1 }}>{sa ? "Editar Super Admin" : "Nuevo Super Admin"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
          <div><label style={LBL}>NOMBRE *</label><input className="input" value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Nombre completo" /></div>
          <div><label style={LBL}>EMAIL *</label><input className="input" type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="superadmin@petflow.io" /></div>
          <div><label style={LBL}>{sa ? "NUEVA CONTRASEÑA" : "CONTRASEÑA *"}</label><input className="input" type="password" value={form.password} onChange={e => f("password", e.target.value)} placeholder="••••••••" />{!sa && <PasswordHint />}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{sa ? "Guardar Cambios" : "Crear Super Admin"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalCliente = ({ cliente, empresas, sedes, onSave, onClose, defaultValues = {} }) => {
  const [form, setForm] = useState(cliente || { nombres: "", apellidos: "", celular: "", email: "", empresaId: defaultValues.empresaId || "", sedeId: defaultValues.sedeId || "", password: "" });
  const sedesFiltradas = Object.values(sedes).filter(s => s.empresaId === form.empresaId);
  const handleSave = () => { if (!form.nombres || !form.apellidos || !form.celular || !form.email || !form.empresaId || (!cliente && !form.password)) { alert("Complete todos los campos obligatorios"); return; } onSave(form); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 600, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.tx1 }}>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid" style={{ gap: 20, marginBottom: 24 }}>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>NOMBRES *</label><input className="input" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} placeholder="Juan Carlos" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>APELLIDOS *</label><input className="input" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} placeholder="Pérez García" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>CELULAR *</label><input className="input" value={form.celular} onChange={e => setForm({ ...form, celular: e.target.value })} placeholder="+57 300 123 4567" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMAIL *</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" /></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMPRESA *</label><select className="input" value={form.empresaId} onChange={e => setForm({ ...form, empresaId: e.target.value, sedeId: "" })}><option value="">Seleccionar empresa...</option>{Object.values(empresas).map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}</select></div>
          <div><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>SEDE</label><select className="input" value={form.sedeId} onChange={e => setForm({ ...form, sedeId: e.target.value })} disabled={!form.empresaId}><option value="">Todas las sedes</option>{sedesFiltradas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
          {!cliente && <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>CONTRASEÑA *</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /><PasswordHint /></div>}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{cliente ? "Guardar Cambios" : "Crear Cliente"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalEditarPerfil = ({ perfil, onSave, onClose }) => {
  const [form, setForm] = useState(perfil || { nombre: "", apellido: "", email: "", telefono: "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => { if (!form.nombre || !form.email) { alert("Nombre y email son obligatorios"); return; } onSave(form); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>Editar Perfil</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid" style={{ gap: 18, marginBottom: 24 }}>
          <div><label style={LBL}>NOMBRE *</label><input className="input" value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Juan" /></div>
          <div><label style={LBL}>APELLIDO</label><input className="input" value={form.apellido} onChange={e => f("apellido", e.target.value)} placeholder="Pérez" /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={LBL}>CORREO *</label><input className="input" type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="correo@ejemplo.com" /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={LBL}>TELÉFONO</label><input className="input" value={form.telefono} onChange={e => f("telefono", e.target.value)} placeholder="+57 300 123 4567" /></div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Guardar Cambios</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalCambiarClave = ({ onClose }) => {
  const [form, setForm] = useState({ nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };
  const handleSave = () => {
    if (!form.nueva || !form.confirmar) { setError("Complete todos los campos"); return; }
    if (form.nueva !== form.confirmar) { setError("Las claves no coinciden"); return; }
    if (!/[A-Z]/.test(form.nueva) || !/[!@#$%^&*(),.?":{}|<>_\-]/.test(form.nueva)) {
      setError("La clave debe tener al menos una mayúscula y un carácter especial"); return;
    }
    alert("✓ Clave actualizada");
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 440, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>Cambiar Clave</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
          <div>
            <label style={LBL}>NUEVA CLAVE *</label>
            <input className="input" type="password" value={form.nueva} onChange={e => f("nueva", e.target.value)} placeholder="••••••••" />
            <PasswordHint />
          </div>
          <div>
            <label style={LBL}>CONFIRMAR CLAVE *</label>
            <input className="input" type="password" value={form.confirmar} onChange={e => f("confirmar", e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        {error && <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 14, padding: 14, color: T.rose, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>⚠ {error}</div>}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Cambiar Clave</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalRestablecerClave = ({ userName, onSave, onClose }) => {
  const [form, setForm] = useState({ nueva: "", confirmar: "" });
  const [error, setError] = useState("");
  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };
  const handleSave = () => {
    if (!form.nueva || !form.confirmar) { setError("Complete todos los campos"); return; }
    if (form.nueva !== form.confirmar) { setError("Las claves no coinciden"); return; }
    if (!/[A-Z]/.test(form.nueva) || !/[!@#$%^&*(),.?":{}|<>_\-]/.test(form.nueva)) {
      setError("La clave debe tener al menos una mayúscula y un carácter especial"); return;
    }
    onSave(form.nueva);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 440, padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>Restablecer Clave</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: T.tx3, marginBottom: 24, fontWeight: 500 }}>{userName}</p>
        <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
          <div>
            <label style={LBL}>NUEVA CLAVE *</label>
            <input className="input" type="password" value={form.nueva} onChange={e => f("nueva", e.target.value)} placeholder="••••••••" autoFocus />
            <PasswordHint />
          </div>
          <div>
            <label style={LBL}>CONFIRMAR CLAVE *</label>
            <input className="input" type="password" value={form.confirmar} onChange={e => f("confirmar", e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        {error && <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 14, padding: 14, color: T.rose, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>⚠ {error}</div>}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Establecer Clave</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const CampanaNotificaciones = ({ notificaciones, onMarcarLeida, onMarcarTodas }) => {
  const [open, setOpen] = useState(false);
  const lista = Object.values(notificaciones).filter(n => !n.leida).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const count  = lista.length;

  const tipoIcon = (tipo) => {
    const ic = tipo === "cumpleanos" ? Icons.cake : tipo === "vacuna" || tipo === "vacuna_vencida" ? Icons.vacunas : tipo === "citas" ? Icons.citas : tipo === "medicamento" || tipo === "recordatorio_med" ? Icons.pill : Icons.bell;
    return <span style={{ color: T.primary, display: "flex" }}>{ic}</span>;
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn"
        style={{ borderRadius: "50%", padding: 0, width: 46, height: 46, flexShrink: 0, position: "relative" }}
        onClick={() => setOpen(o => !o)}
        title="Notificaciones"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            background: T.rose, color: "white",
            borderRadius: "50%", minWidth: 18, height: 18,
            fontSize: 10, fontWeight: 800, lineHeight: "18px",
            textAlign: "center", padding: "0 3px",
            boxShadow: "0 0 0 2px " + T.bg,
            pointerEvents: "none",
          }}>{count > 9 ? "9+" : count}</span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div className="card" style={{
            position: "absolute", right: 0, top: "calc(100% + 10px)",
            zIndex: 100, padding: 0, width: 330, maxHeight: 420,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(197,205,216,0.4)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.tx1 }}>Notificaciones</span>
              {count > 0 && (
                <button onClick={onMarcarTodas} style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Leer todas
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {count === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center", color: T.tx3, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
                  Todo al día
                </div>
              ) : lista.map(n => (
                <div key={n.id} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid rgba(197,205,216,0.25)", alignItems: "flex-start", background: T.surface }}>
                  <div className="inset" style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {tipoIcon(n.tipo)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{n.titulo}</div>
                    <div style={{ fontSize: 11.5, color: T.tx2, lineHeight: 1.4, wordBreak: "break-word" }}>{n.mensaje}</div>
                    <div style={{ fontSize: 10.5, color: T.tx3, marginTop: 4, fontWeight: 500 }}>{n.fecha}</div>
                  </div>
                  <button
                    onClick={() => onMarcarLeida(n.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.tx3, fontSize: 14, lineHeight: 1, flexShrink: 0, padding: "2px 4px", borderRadius: 6 }}
                    title="Marcar como leída"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ESTADO_CITA = [
  { v: "pendiente",  l: "Pendiente",  c: "#f59e0b" },
  { v: "confirmada", l: "Confirmada", c: "#3f8fb0"  },
  { v: "completada", l: "Completada", c: "#10b981"  },
  { v: "cancelada",  l: "Cancelada",  c: "#f43f5e"  },
];

const CalendarioNeuro = ({ value, onChange, citasPorFecha = {}, blockPast = false }) => {
  const hoy = new Date();
  const [vista, setVista] = useState(() => {
    const d = value ? new Date(value + "T12:00:00") : new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const SEMS = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
  const primero = new Date(vista.y, vista.m, 1);
  const totalDias = new Date(vista.y, vista.m + 1, 0).getDate();
  const inicioSem = (primero.getDay() + 6) % 7;
  const celdas = [];
  for (let i = 0; i < inicioSem; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  const esHoy = (d) => d === hoy.getDate() && vista.m === hoy.getMonth() && vista.y === hoy.getFullYear();
  const esSel = (d) => {
    if (!value) return false;
    const s = new Date(value + "T12:00:00");
    return d === s.getDate() && vista.m === s.getMonth() && vista.y === s.getFullYear();
  };
  const fmtKey = (d) => `${vista.y}-${String(vista.m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const hoyKey = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
  const esPasado = (d) => blockPast && fmtKey(d) < hoyKey;
  const prev = () => setVista(v => { const d = new Date(v.y, v.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const next = () => setVista(v => { const d = new Date(v.y, v.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  return (
    <div className="inset" style={{ padding: "20px 16px", borderRadius: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button type="button" className="btn" style={{ padding: "9px 15px", fontSize: 20, lineHeight: 1 }} onClick={prev}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 15, color: T.tx1 }}>{MESES[vista.m]} {vista.y}</span>
        <button type="button" className="btn" style={{ padding: "9px 15px", fontSize: 20, lineHeight: 1 }} onClick={next}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {SEMS.map(s => <div key={s} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: T.tx3, letterSpacing: "0.5px" }}>{s}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {celdas.map((d, i) => {
          if (d === null) return <div key={`v${i}`} />;
          const sel = esSel(d);
          const tod = esHoy(d);
          const pas = esPasado(d);
          const key = fmtKey(d);
          const nC = citasPorFecha[key]?.length || 0;
          return (
            <button
              type="button"
              key={d}
              onClick={() => !pas && onChange(key)}
              disabled={pas}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.6)",
                cursor: pas ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                fontSize: 12, fontWeight: sel || tod ? 800 : 600,
                color: sel ? "white" : tod ? T.primary : pas ? T.tx3 : T.tx1,
                background: sel ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : T.surface,
                boxShadow: sel
                  ? `inset 4px 4px 10px rgba(20,65,85,0.45), inset -4px -4px 10px rgba(255,255,255,0.12)`
                  : tod
                  ? `5px 5px 12px #c5cdd8, -5px -5px 12px #ffffff, 0 0 0 2px ${T.primary}`
                  : pas
                  ? "none"
                  : `4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff`,
                transition: "all 0.18s ease",
                padding: "4px 2px",
                opacity: pas ? 0.33 : 1,
              }}
            >
              {d}
              {nC > 0 && !pas && <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel ? "rgba(255,255,255,0.85)" : T.primary, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimePickerNeuro = ({ value = "09:00", onChange }) => {
  const parts = (value || "09:00").split(":");
  const h = parseInt(parts[0]) || 9;
  const m = parseInt(parts[1]) || 0;
  const upd = (nh, nm) => onChange(`${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`);
  const ChevUp = () => (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,7 6,2 11,7"/></svg>
  );
  const ChevDown = () => (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,2 6,7 11,2"/></svg>
  );
  const spinS = { width: 40, height: 34, borderRadius: 12, border: "1px solid rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: T.surface, boxShadow: `4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff`, color: T.tx2, transition: "all 0.15s ease", flexShrink: 0 };
  const digitS = { width: 70, height: 70, borderRadius: 20, background: "linear-gradient(145deg, #e4e8ed, #f4f8fc)", boxShadow: "inset 7px 7px 16px #c5cdd8, inset -7px -7px 16px #ffffff", border: "1px solid rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: T.tx1, letterSpacing: "-1px", userSelect: "none" };
  return (
    <div className="inset" style={{ padding: "18px 24px", borderRadius: 22, display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button type="button" style={spinS} onClick={() => upd((h + 1) % 24, m)}><ChevUp /></button>
        <div style={digitS}>{String(h).padStart(2,"0")}</div>
        <button type="button" style={spinS} onClick={() => upd((h - 1 + 24) % 24, m)}><ChevDown /></button>
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, color: T.tx3, lineHeight: 1, userSelect: "none", paddingBottom: 2 }}>:</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button type="button" style={spinS} onClick={() => upd(h, (m + 5) % 60)}><ChevUp /></button>
        <div style={digitS}>{String(m).padStart(2,"0")}</div>
        <button type="button" style={spinS} onClick={() => upd(h, (m - 5 + 60) % 60)}><ChevDown /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 2 }}>
        {[{ l: "AM", act: h < 12 }, { l: "PM", act: h >= 12 }].map(({ l, act }) => (
          <button key={l} type="button"
            onClick={() => { if (l === "AM" && h >= 12) upd(h - 12, m); else if (l === "PM" && h < 12) upd(h + 12, m); }}
            style={{ padding: "7px 14px", borderRadius: 13, fontSize: 12, fontWeight: 800, border: "1px solid rgba(255,255,255,0.6)", cursor: "pointer", background: act ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : T.surface, color: act ? "white" : T.tx3, boxShadow: act ? `inset 3px 3px 8px rgba(20,65,85,0.4), inset -3px -3px 8px rgba(255,255,255,0.1)` : `4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff`, transition: "all 0.18s ease" }}
          >{l}</button>
        ))}
      </div>
    </div>
  );
};

const HORARIO_SLOTS = (() => {
  const s = [];
  for (let h = 7; h <= 18; h++) { s.push(`${String(h).padStart(2,"0")}:00`); if (h < 18) s.push(`${String(h).padStart(2,"0")}:30`); }
  return s;
})();

const SlotGrid = ({ value, onChange, ocupados = [] }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
    {HORARIO_SLOTS.map(slot => {
      const occ = ocupados.includes(slot);
      const sel = slot === value;
      return (
        <button key={slot} type="button" disabled={occ}
          onClick={() => onChange(slot)}
          title={occ ? "Hora ocupada" : slot}
          style={{
            padding: "9px 4px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: occ ? "not-allowed" : "pointer",
            border: `2px solid ${sel ? T.primary : occ ? "#f43f5e40" : "rgba(255,255,255,0.6)"}`,
            background: sel ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : occ ? "#f43f5e0d" : T.surface,
            color: sel ? "white" : occ ? "#f43f5e" : T.tx2,
            boxShadow: sel ? `inset 4px 4px 10px rgba(20,65,85,0.4), inset -4px -4px 10px rgba(255,255,255,0.1)` : occ ? "none" : T.nmSm,
            opacity: occ ? 0.55 : 1,
            textDecoration: occ ? "line-through" : "none",
            transition: "all 0.15s",
          }}>
          {slot}
        </button>
      );
    })}
  </div>
);

const ModalNuevaCita = ({ cita, clientes, mascotas, sedes, citasExistentes, isAdmin, motivosCitas, onSave, onClose }) => {
  const [form, setForm] = useState(cita || { fecha: "", hora: "09:00", clienteId: "", mascotaId: "", sedeId: "", motivo: "", estado: "pendiente", notas: "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const mascsFiltradas = isAdmin
    ? (form.clienteId ? Object.values(mascotas).filter(m => m.clienteId === form.clienteId) : [])
    : Object.values(mascotas);
  const sedesList = sedes ? Object.values(sedes) : [];
  const fmtFecha = (fec) => fec ? new Date(fec + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;
  // Compute occupied slots for the selected date (exclude current cita being edited)
  const ocupados = form.fecha
    ? (citasExistentes || [])
        .filter(c => c.fecha === form.fecha && c.estado !== "cancelada" && c.id !== cita?.id && (!form.sedeId || !c.sedeId || c.sedeId === form.sedeId))
        .map(c => c.hora)
    : [];
  const _todayStr = colDate();
  const _nowHHMM  = colTime();
  const slotsPasados = form.fecha === _todayStr ? HORARIO_SLOTS.filter(s => s < _nowHHMM) : [];
  const ocupadosConPasados = [...new Set([...ocupados, ...slotsPasados])];
  const slotOcupado = ocupadosConPasados.includes(form.hora);
  const handleSave = () => {
    if (!form.fecha || !form.motivo) { alert("Fecha y motivo son obligatorios"); return; }
    if (isAdmin && !form.clienteId) { alert("Selecciona un cliente"); return; }
    if (form.fecha < _todayStr) { alert("No puedes agendar citas en fechas pasadas."); return; }
    if (slotOcupado) { alert(`La hora ${form.hora} ya está ocupada o ha pasado. Elige otro horario.`); return; }
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 560, padding: 32, maxHeight: "93vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>{cita ? (isAdmin ? "Editar Cita" : "Reprogramar Cita") : "Nueva Cita"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={LBL}>FECHA *</label>
          <CalendarioNeuro value={form.fecha} onChange={v => f("fecha", v)} blockPast={true} />
          {form.fecha && <p style={{ fontSize: 12, color: T.primary, fontWeight: 700, marginTop: 10, paddingLeft: 2, display: "flex", alignItems: "center", gap: 5 }}><span style={{ display: "inline-flex" }}>{Icons.citas}</span>{fmtFecha(form.fecha)}</p>}
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={LBL}>HORA {form.fecha ? `· ${ocupados.length > 0 ? `${ocupados.length} ocupada${ocupados.length > 1 ? "s" : ""}` : "todos libres"}` : ""}{slotsPasados.length > 0 ? ` · ${slotsPasados.length} pasada${slotsPasados.length > 1 ? "s" : ""}` : ""}</label>
            {slotOcupado && <span style={{ fontSize: 11, fontWeight: 800, color: "#f43f5e", background: "#f43f5e18", padding: "3px 10px", borderRadius: 8 }}>⚠ Hora ocupada</span>}
          </div>
          {form.fecha ? (
            <SlotGrid value={form.hora} onChange={v => f("hora", v)} ocupados={ocupadosConPasados} />
          ) : (
            <div className="inset" style={{ padding: "16px", borderRadius: 16, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: T.tx3 }}>Selecciona una fecha primero para ver disponibilidad</p>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
          {isAdmin && (
            <div>
              <label style={LBL}>ESTADO</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ESTADO_CITA.map(e => (
                  <button key={e.v} onClick={() => f("estado", e.v)}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 14, border: `2px solid ${form.estado === e.v ? e.c : "transparent"}`, background: form.estado === e.v ? e.c + "22" : T.surface, color: form.estado === e.v ? e.c : T.tx3, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: form.estado === e.v ? T.nmSm : "none", transition: "all 0.2s" }}>
                    {e.l}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isAdmin && (
            <div>
              <label style={LBL}>CLIENTE *</label>
              <select className="input" value={form.clienteId} onChange={e => { f("clienteId", e.target.value); f("mascotaId", ""); }}>
                <option value="">Seleccionar cliente...</option>
                {Object.values(clientes).map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={LBL}>MASCOTA</label>
            <select className="input" value={form.mascotaId} onChange={e => f("mascotaId", e.target.value)} disabled={isAdmin && !form.clienteId}>
              <option value="">Seleccionar mascota...</option>
              {mascsFiltradas.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>)}
            </select>
          </div>
          {isAdmin && sedesList.length > 1 && (
            <div>
              <label style={LBL}>SEDE</label>
              <select className="input" value={form.sedeId} onChange={e => f("sedeId", e.target.value)}>
                <option value="">Sin sede específica</option>
                {sedesList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={LBL}>MOTIVO *</label>
            {motivosCitas && motivosCitas.length > 0 ? (
              <select className="input" value={form.motivo} onChange={e => f("motivo", e.target.value)}>
                <option value="">Seleccionar motivo...</option>
                {motivosCitas.map((m, i) => <option key={i} value={m}>{m}</option>)}
              </select>
            ) : (
              <input className="input" value={form.motivo} onChange={e => f("motivo", e.target.value)} placeholder="Ej: Vacunación anual, Consulta general..." />
            )}
          </div>
          <div>
            <label style={LBL}>NOTAS ADICIONALES</label>
            <textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.notas || ""} onChange={e => f("notas", e.target.value)} placeholder="Observaciones, preparación previa, etc." />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{cita ? "Guardar Cambios" : "Agendar Cita"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const Icons = {
  inicio:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  empresas: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  sedes:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  admins:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clientes: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mascotas: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>,
  citas:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  reportes: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  logout:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  agenda:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  ajustes:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  historial: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  vacunas:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  bell:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  cake:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>,
  pill:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="M8.5 8.5 16 16"/></svg>,
  dog:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>,
  cat:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.26A9.06 9.06 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></svg>,
  bird:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>,
  worm:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 16 1.5-1.5"/><path d="M6.5 19a4 4 0 0 0 5.5-1l4.5-4.5a4 4 0 0 0-5.5-5.5L6 12.5"/><path d="M4.5 17a2.5 2.5 0 1 1 3.5 3.5"/></svg>,
  globe:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  alert:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  box:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  clock:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const MENU = [
  { id: "inicio",       label: "Inicio",         iconKey: "inicio"    },
  { id: "empresas",     label: "Empresas",        iconKey: "empresas"  },
  { id: "sedes",        label: "Sedes",           iconKey: "sedes"     },
  { id: "admins",       label: "Usuarios Admin",  iconKey: "admins"    },
  { id: "clientes",     label: "Clientes",        iconKey: "clientes"  },
  { id: "mascotas",     label: "Mascotas",        iconKey: "mascotas"  },
  { id: "reportes",     label: "Reportes",        iconKey: "reportes"  },
  { id: "superadmins",  label: "Super Admins",    iconKey: "admins"    },
  { id: "ajustes",      label: "Ajustes",         iconKey: "ajustes"   },
];

const MetricCard = ({ icon, value, label, color, sub }) => (
  <div className="card" style={{ padding: "22px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div className="inset" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx2 }}>{label}</span>
    </div>
    <div style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: T.tx3, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const TabInicio = ({ db, perfil }) => {
  const nEmp      = Object.keys(db.empresas).length;
  const nSedes    = Object.keys(db.sedes).length;
  const nAdmins   = Object.keys(db.adminUsers).length;
  const nCli      = Object.keys(db.clientes).length;
  const nMascotas = Object.keys(db.mascotas || {}).length;
  const empConSede  = Object.keys(db.empresas).filter(id => Object.values(db.sedes).some(s => s.empresaId === id)).length;
  const empConAdmin = Object.keys(db.empresas).filter(id => Object.values(db.adminUsers).some(a => a.empresaId === id)).length;

  return (
    <div>
      {/* Bienvenida */}
      <div className="card" style={{ padding: "22px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
        <div className="inset" style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><LogoImg size={75} /></div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.tx1 }}>Bienvenido, {perfil.nombre} {perfil.apellido}</h2>
          <p style={{ fontSize: 13, color: T.tx3, marginTop: 3 }}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: COL_TZ })}
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="metrics-grid" style={{ gap: 20 }}>
        <MetricCard icon={Icons.empresas} value={nEmp}    label="Empresas"       color={T.primary}  sub={`${empConSede} con sedes · ${empConAdmin} con admin`} />
        <MetricCard icon={Icons.sedes}    value={nSedes}  label="Sedes"          color="#0ea5e9"    sub={nEmp > 0 ? `Promedio ${(nSedes / nEmp).toFixed(1)} por empresa` : "Sin empresas aún"} />
        <MetricCard icon={Icons.admins}   value={nAdmins} label="Usuarios Admin" color="#f59e0b"    sub={`En ${empConAdmin} empresa${empConAdmin !== 1 ? "s" : ""}`} />
        <MetricCard icon={Icons.clientes} value={nCli}    label="Clientes"       color="#ec4899"    sub={nEmp > 0 ? `Promedio ${(nCli / nEmp).toFixed(1)} por empresa` : "Sin empresas aún"} />
        <MetricCard icon={Icons.mascotas} value={nMascotas} label="Mascotas"     color="#8b5cf6"    sub={nCli > 0 ? `Promedio ${(nMascotas / nCli).toFixed(1)} por cliente` : "Sin clientes aún"} />
      </div>
    </div>
  );
};

const ESPECIES = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Pez", "Hámster", "Otro"];
const GENEROS  = ["Macho", "Hembra"];

const ModalMascota = ({ mascota, clientes, empresas, onSave, onClose, defaultValues = {} }) => {
  const [form, setForm] = useState(mascota || { nombre: "", especie: "Gato", raza: "", genero: "Hembra", edad: "", fechaCumpleanos: "", foto: null, clienteId: defaultValues.clienteId || "", empresaId: defaultValues.empresaId || "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const clientesFiltrados = Object.values(clientes).filter(c => !form.empresaId || c.empresaId === form.empresaId);
  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => f("foto", ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleSave = () => {
    if (!form.nombre || !form.clienteId || !form.empresaId) { alert("Nombre, empresa y cliente son obligatorios"); return; }
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 660, padding: 32, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>{mascota ? "Editar Mascota" : "Nueva Mascota"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        {/* Foto upload */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div className="inset" style={{ width: 110, height: 110, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {form.foto
                ? <img src={form.foto} alt="mascota" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.tx3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              }
            </div>
            <span style={{ fontSize: 12, color: T.tx3, fontWeight: 600 }}>Subir foto</span>
            <input type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
          </label>
        </div>

        <div className="form-grid" style={{ gap: 18, marginBottom: 24 }}>
          <div style={{ gridColumn: "1 / -1" }}><label style={LBL}>NOMBRE *</label><input className="input" value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Ej: Luna" /></div>
          <div><label style={LBL}>ESPECIE</label><select className="input" value={form.especie} onChange={e => f("especie", e.target.value)}>{ESPECIES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label style={LBL}>RAZA</label><input className="input" value={form.raza} onChange={e => f("raza", e.target.value)} placeholder="Ej: Persa" /></div>
          <div><label style={LBL}>GÉNERO</label><select className="input" value={form.genero} onChange={e => f("genero", e.target.value)}>{GENEROS.map(g => <option key={g}>{g}</option>)}</select></div>
          <div><label style={LBL}>EDAD (años)</label><input className="input" type="number" min="0" max="30" value={form.edad} onChange={e => f("edad", e.target.value)} placeholder="3" /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={LBL}>FECHA DE CUMPLEAÑOS</label><input className="input" type="date" value={form.fechaCumpleanos} onChange={e => f("fechaCumpleanos", e.target.value)} /></div>
          <div><label style={LBL}>EMPRESA *</label><select className="input" value={form.empresaId} onChange={e => f("empresaId", e.target.value) || f("clienteId", "")}><option value="">Seleccionar...</option>{Object.values(empresas).map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}</select></div>
          <div><label style={LBL}>CLIENTE (dueño) *</label><select className="input" value={form.clienteId} onChange={e => f("clienteId", e.target.value)} disabled={!form.empresaId}><option value="">Seleccionar...</option>{clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select></div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{mascota ? "Guardar Cambios" : "Crear Mascota"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};


const TabMascotas = ({ db, onNueva, onEditar, onEliminar }) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [carnetId, setCarnetId] = useState(null);
  const q = search.toLowerCase();
  const mascotasList = Object.values(db.mascotas || {}).filter(m =>
    !q || m.nombre.toLowerCase().includes(q) || (m.especie || "").toLowerCase().includes(q) || (m.raza || "").toLowerCase().includes(q)
  );
  const byEmpresa = Object.values(db.empresas).map(emp => {
    const empMasc = mascotasList.filter(m => m.empresaId === emp.id);
    const byCliente = Object.values(db.clientes).filter(c => c.empresaId === emp.id).map(cli => ({
      cli, mascotas: empMasc.filter(m => m.clienteId === cli.id)
    })).filter(g => g.mascotas.length > 0);
    return { emp, byCliente, total: empMasc.length };
  });
  const totalGlobal = Object.keys(db.mascotas || {}).length;
  const carnetMasc = carnetId ? db.mascotas?.[carnetId] : null;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch ? 12 : 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Mascotas ({totalGlobal})</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => setShowSearch(s => !s)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="btn-primary" onClick={onNueva} disabled={Object.keys(db.clientes).length === 0}>Nueva Mascota</button>
        </div>
      </div>
      {showSearch && <div style={{ marginBottom: 20 }}><input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, especie o raza..." autoFocus /></div>}
      {Object.keys(db.clientes).length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Primero debes registrar clientes para poder agregar mascotas</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {byEmpresa.map(({ emp, byCliente, total }) => total === 0 ? null : (
            <div key={emp.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{Icons.empresas}</div>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.tx1 }}>{emp.nombre}</span>
                <span className="badge badge-primary" style={{ marginLeft: "auto" }}>{total} mascota{total !== 1 ? "s" : ""}</span>
              </div>
              {byCliente.map(({ cli, mascotas }) => (
                <div key={cli.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
                    <span style={{ color: T.primary }}>{Icons.clientes}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.tx2 }}>{cli.nombres} {cli.apellidos}</span>
                    <span style={{ fontSize: 11, color: T.tx3 }}>{cli.celular}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {mascotas.map(m => (
                      <div key={m.id} className="inset" style={{ borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: "0 1 auto" }}>
                        {/* Mini foto */}
                        <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "3px 3px 8px #c5cdd8, -3px -3px 8px #ffffff" }}>
                          {m.foto ? <img src={m.foto} alt={m.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: T.primary, display: "flex" }}>{m.especie === "Gato" ? Icons.cat : m.especie === "Perro" ? Icons.dog : m.especie === "Ave" ? Icons.bird : Icons.mascotas}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: T.tx1 }}>{m.nombre}</div>
                          <div style={{ fontSize: 11, color: T.tx3, marginTop: 1 }}>{m.especie}{m.raza ? ` · ${m.raza}` : ""} · {m.genero}</div>
                          {m.edad && <div style={{ fontSize: 11, color: T.tx3 }}>{m.edad} año{m.edad != 1 ? "s" : ""}</div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setCarnetId(m.id)} title="Ver carnet">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                          </button>
                          <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onEditar(m)}>Editar</button>
                          <button className="btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onEliminar(m.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {mascotasList.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ color: T.tx3 }}>{q ? "Sin mascotas que coincidan con la búsqueda" : "No hay mascotas registradas aún"}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal carnet */}
      {carnetMasc && (
        <div className="modal-overlay" onClick={() => setCarnetId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <CarnetDigital mascota={carnetMasc} cliente={db.clientes[carnetMasc.clienteId]} empresa={db.empresas[carnetMasc.empresaId]} />
            <button className="btn" onClick={() => setCarnetId(null)} style={{ width: 280 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const REPORTS_LIST = [
  { id: "clientes",   nombre: "Reporte de Clientes",   descripcion: "Listado completo de clientes registrados, datos de contacto, empresa asociada e historial de mascotas.", iconKey: "clientes"  },
  { id: "citas",      nombre: "Reporte de Citas",       descripcion: "Historial de citas agendadas, completadas y canceladas. Incluye estadísticas de asistencia por sede.",   iconKey: "citas"     },
  { id: "inventario", nombre: "Reporte de Inventario",  descripcion: "Control de productos, medicamentos e insumos por sede. Incluye stock actual, alertas de mínimo y movimientos.", iconKey: "box"  },
];

const TabReportes = ({ db, reportes, toggleReporte }) => {
  const empresasList = Object.values(db.empresas);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {REPORTS_LIST.map(rep => (
        <div key={rep.id} className="card" style={{ padding: 28 }}>
          {/* Header del reporte */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div className="inset" style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary }}>{Icons[rep.iconKey]}</div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: T.tx1, marginBottom: 4 }}>{rep.nombre}</h3>
              <p style={{ fontSize: 13, color: T.tx3, lineHeight: 1.5 }}>{rep.descripcion}</p>
            </div>
          </div>

          {/* Toggles por empresa */}
          {empresasList.length === 0 ? (
            <div className="inset" style={{ padding: 20, textAlign: "center" }}>
              <p style={{ color: T.tx3, fontSize: 13 }}>No hay empresas registradas aún</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4, paddingLeft: 4 }}>
                Activar por empresa
              </div>
              {empresasList.map(emp => {
                const activo = reportes[emp.id]?.[rep.id] ?? true;
                return (
                  <div key={emp.id} className="inset" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{emp.nombre}</div>
                      <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>NIT: {emp.nit}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: activo ? T.primary : T.tx3 }}>
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                      <Toggle checked={activo} onChange={() => toggleReporte(emp.id, rep.id)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TIPOS_HISTORIAL = ["Consulta", "Vacuna", "Cirugía", "Urgencia", "Desparasitación", "Control", "Otro"];
const FRECUENCIAS = ["Una vez al día", "Dos veces al día", "Tres veces al día", "Cada 8 horas", "Cada 12 horas", "Cada 24 horas", "Cada 48 horas", "Cada 72 horas", "Según indicación"];
const DURACIONES  = ["3 días", "5 días", "7 días", "10 días", "14 días", "21 días", "30 días", "60 días", "Continuo", "Según indicación"];
const NOMBRES_VACUNAS = ["Triple felina (Gatos)", "Antirrábica (Perros y Gatos)", "Quíntuple (Perros)", "Séxtuple (Perros)", "Leucemia felina (Gatos)", "Panleucopenia felina (Gatos)", "Bordetella (Perros)", "Leptospira (Perros)", "Influenza canina (Perros)", "Coronavirus felino (Gatos)", "Giardia (Perros)"];
const NOMBRES_DESPARASITANTES = ["Desparasitación interna (Perros y Gatos)", "Desparasitación externa (Perros y Gatos)", "Antipulgas (Perros y Gatos)", "Antigarrapatas (Perros)", "Antiparasitario tópico (Perros y Gatos)", "Pipeta antiparasitaria (Perros y Gatos)"];

const MedicamentosForm = ({ medicamentos, allMeds, onChange }) => {
  const selectedNames = medicamentos.map(m => typeof m === "string" ? m : m.nombre);

  const toggleMed = (nombre) => {
    if (selectedNames.includes(nombre)) {
      onChange(medicamentos.filter(m => (typeof m === "string" ? m : m.nombre) !== nombre));
    } else {
      onChange([...medicamentos, { nombre, dosis: "", frecuencia: "Cada 12 horas", duracion: "7 días" }]);
    }
  };

  const updateMed = (nombre, field, value) => {
    onChange(medicamentos.map(m => {
      const n = typeof m === "string" ? m : m.nombre;
      return n === nombre ? { ...(typeof m === "string" ? { nombre: m } : m), [field]: value } : m;
    }));
  };

  return (
    <div>
      <label style={LBL}>MEDICAMENTOS</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: selectedNames.length > 0 ? 16 : 0 }}>
        {allMeds.map(nombre => {
          const active = selectedNames.includes(nombre);
          return (
            <button key={nombre} type="button"
              onClick={() => toggleMed(nombre)}
              style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.18s ease",
                background: active ? `linear-gradient(135deg, ${T.emerald}, #34d399)` : T.surface,
                color: active ? "white" : T.tx2,
                boxShadow: active ? `inset 3px 3px 8px rgba(5,90,60,0.35), inset -3px -3px 8px rgba(255,255,255,0.1)` : T.nmSm,
              }}>
              {nombre}
            </button>
          );
        })}
        {allMeds.length === 0 && <span style={{ fontSize: 12, color: T.tx3 }}>Sin medicamentos configurados en Ajustes</span>}
      </div>

      {/* Detail rows for each selected medication */}
      {medicamentos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {medicamentos.map((med, i) => {
            const obj = typeof med === "string" ? { nombre: med, dosis: "", frecuencia: "Cada 12 horas", duracion: "7 días" } : med;
            return (
              <div key={obj.nombre} className="inset" style={{ padding: "14px 16px", borderRadius: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.emerald, marginBottom: 10 }}>{obj.nombre}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ ...LBL, fontSize: 11 }}>DOSIS</label>
                    <input className="input" style={{ padding: "10px 12px", fontSize: 12 }} value={obj.dosis} onChange={e => updateMed(obj.nombre, "dosis", e.target.value)} placeholder="Ej: 250mg, 1 tab, 5ml" />
                  </div>
                  <div>
                    <label style={{ ...LBL, fontSize: 11 }}>FRECUENCIA</label>
                    <select className="input" style={{ padding: "10px 12px", fontSize: 12 }} value={obj.frecuencia} onChange={e => updateMed(obj.nombre, "frecuencia", e.target.value)}>
                      {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...LBL, fontSize: 11 }}>DURACIÓN</label>
                    <select className="input" style={{ padding: "10px 12px", fontSize: 12 }} value={obj.duracion} onChange={e => updateMed(obj.nombre, "duracion", e.target.value)}>
                      {DURACIONES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TagSelector = ({ label, items, selected, onChange }) => (
  <div>
    <label style={LBL}>{label}</label>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map(item => {
        const active = selected.includes(item);
        return (
          <button key={item} type="button"
            onClick={() => onChange(active ? selected.filter(x => x !== item) : [...selected, item])}
            style={{ padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.18s ease",
              background: active ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : T.surface,
              color: active ? "white" : T.tx2,
              boxShadow: active ? `inset 3px 3px 8px rgba(20,65,85,0.4), inset -3px -3px 8px rgba(255,255,255,0.1)` : T.nmSm,
            }}>
            {item}
          </button>
        );
      })}
      {items.length === 0 && <span style={{ fontSize: 12, color: T.tx3 }}>Sin opciones configuradas aún</span>}
    </div>
  </div>
);

const ModalHistorial = ({ historial, mascota, ajustes, onSave, onClose }) => {
  const [form, setForm] = useState(historial || {
    fecha: "", tipo: "Consulta", descripcion: "", veterinario: "",
    diagnostico: "", tratamientos: [], medicamentos: [], notas: "", peso: "",
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.fecha || !form.descripcion) { alert("Fecha y descripción son obligatorios"); return; }
    onSave(form);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 680, padding: 32, maxHeight: "93vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>{historial ? "Editar Registro" : "Nuevo Registro Médico"}</h2>
            {mascota && <p style={{ fontSize: 13, color: T.tx3, marginTop: 3 }}>{mascota.nombre} · {mascota.especie}</p>}
          </div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          {/* Fecha + Tipo */}
          <div className="form-grid" style={{ gap: 16 }}>
            <div>
              <label style={LBL}>FECHA *</label>
              <input className="input" type="date" value={form.fecha} onChange={e => f("fecha", e.target.value)} />
            </div>
            <div>
              <label style={LBL}>TIPO</label>
              <select className="input" value={form.tipo} onChange={e => f("tipo", e.target.value)}>
                {TIPOS_HISTORIAL.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción + Veterinario */}
          <div className="form-grid" style={{ gap: 16 }}>
            <div>
              <label style={LBL}>DESCRIPCIÓN / MOTIVO *</label>
              <input className="input" value={form.descripcion} onChange={e => f("descripcion", e.target.value)} placeholder="Ej: Consulta general de rutina" />
            </div>
            <div>
              <label style={LBL}>VETERINARIO</label>
              <input className="input" value={form.veterinario} onChange={e => f("veterinario", e.target.value)} placeholder="Nombre del veterinario" />
            </div>
          </div>

          {/* Peso */}
          <div style={{ maxWidth: 200 }}>
            <label style={LBL}>PESO</label>
            <input className="input" value={form.peso} onChange={e => f("peso", e.target.value)} placeholder="Ej: 4.2 kg" />
          </div>

          {/* Diagnóstico */}
          <div>
            <label style={LBL}>DIAGNÓSTICO</label>
            <textarea className="input" rows={2} value={form.diagnostico} onChange={e => f("diagnostico", e.target.value)} placeholder="Descripción del diagnóstico clínico..." style={{ resize: "vertical", minHeight: 70 }} />
          </div>

          {/* Tratamientos */}
          <TagSelector
            label="TRATAMIENTOS"
            items={ajustes?.tratamientos || []}
            selected={form.tratamientos}
            onChange={v => f("tratamientos", v)}
          />

          {/* Medicamentos con dosificación */}
          <MedicamentosForm
            medicamentos={form.medicamentos}
            allMeds={ajustes?.medicamentos || []}
            onChange={v => f("medicamentos", v)}
          />

          {/* Notas clínicas */}
          <div>
            <label style={LBL}>NOTAS CLÍNICAS</label>
            <textarea className="input" rows={3} value={form.notas} onChange={e => f("notas", e.target.value)} placeholder="Observaciones adicionales, indicaciones para el propietario..." style={{ resize: "vertical", minHeight: 80 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{historial ? "Guardar Cambios" : "Guardar Registro"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ListaAjuste = ({ title, items, onAdd, onRemove, expanded, onToggle }) => {
  const [newVal, setNewVal] = useState("");
  const add = () => {
    const v = newVal.trim();
    if (!v || items.includes(v)) { setNewVal(""); return; }
    onAdd(v);
    setNewVal("");
  };
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: expanded ? 16 : 0 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: T.tx1 }}>{title}</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="badge badge-primary">{items.length}</span>
          <button onClick={onToggle} style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: T.bg, boxShadow: expanded ? "inset 3px 3px 7px #c5cdd8, inset -3px -3px 7px #ffffff" : "4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: T.tx2, transition: "all 0.25s", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>
      {expanded && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, maxHeight: 280, overflowY: "auto" }}>
            {items.map((item, i) => (
              <div key={i} className="inset" style={{ padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 11 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.tx1 }}>{item}</span>
                <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.tx3, fontSize: 14, lineHeight: 1, padding: "2px 4px", borderRadius: 6, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            {items.length === 0 && <p style={{ fontSize: 13, color: T.tx3, textAlign: "center", padding: "8px 0" }}>Sin registros.</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              placeholder={`Nuevo ${title.toLowerCase().slice(0, -1)}... Ej: Amoxicilina (Perros)`}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" style={{ padding: "12px 20px", flexShrink: 0 }} onClick={add}>+</button>
          </div>
        </>
      )}
    </div>
  );
};

const TabAjustes = ({ ajustes, onSave }) => {
  const [trats,   setTrats]   = useState([...(ajustes?.tratamientos  || [])]);
  const [meds,    setMeds]    = useState([...(ajustes?.medicamentos   || [])]);
  const [motivos, setMotivos] = useState([...(ajustes?.motivosCitas   || [])]);
  const [email, setEmail] = useState({ serviceId: "", templateId: "", publicKey: "", fromName: "Voff App", templates: {}, ...(ajustes?.email || {}) });
  const fe = (k, v) => setEmail(p => ({ ...p, [k]: v }));
  const setTpl = (tplKey, field, val) => setEmail(p => ({ ...p, templates: { ...p.templates, [tplKey]: { ...(DEFAULT_EMAIL_TEMPLATES[tplKey] || {}), ...(p.templates?.[tplKey] || {}), [field]: val } } }));
  const getTpl = (tplKey, field) => email.templates?.[tplKey]?.[field] ?? DEFAULT_EMAIL_TEMPLATES[tplKey]?.[field] ?? "";
  const [expandedTpl,   setExpandedTpl]   = useState(null);
  const [showEmail,     setShowEmail]     = useState(false);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [openList, setOpenList] = useState(null);
  const toggleList = (key) => setOpenList(p => p === key ? null : key);

  const handleSave = () => { onSave({ tratamientos: trats, medicamentos: meds, motivosCitas: motivos, email }); alert("✓ Ajustes guardados"); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Ajustes</h2>
        <button className="btn-primary" onClick={handleSave}>Guardar Ajustes</button>
      </div>
      <p style={{ fontSize: 14, color: T.tx2, marginBottom: 28 }}>Configura las listas del historial médico y el servicio de correo para notificaciones.</p>

      {/* Correo de notificaciones — colapsable */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="inset" style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>{Icons.bell}</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: T.tx1 }}>Correo de Notificaciones (EmailJS)</h3>
              <p style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>Credenciales para envío de correos automáticos</p>
            </div>
          </div>
          <button onClick={() => setShowEmail(e => !e)} style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: T.bg, boxShadow: showEmail ? "inset 3px 3px 7px #c5cdd8, inset -3px -3px 7px #ffffff" : "4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: T.tx2, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showEmail ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        {showEmail && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 6 }}>SERVICE ID</label>
              <input className="input" value={email.serviceId} onChange={e => fe("serviceId", e.target.value)} placeholder="service_xxxxxxx" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 6 }}>TEMPLATE ID</label>
              <input className="input" value={email.templateId} onChange={e => fe("templateId", e.target.value)} placeholder="template_xxxxxxx" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 6 }}>PUBLIC KEY</label>
              <input className="input" value={email.publicKey} onChange={e => fe("publicKey", e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxx" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 6 }}>NOMBRE REMITENTE</label>
              <input className="input" value={email.fromName} onChange={e => fe("fromName", e.target.value)} placeholder="Voff App" />
            </div>
          </div>
        )}
      </div>

      {/* Plantillas de mensajes — colapsable */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="inset" style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>{Icons.historial}</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: T.tx1 }}>Mensajes de Notificación</h3>
              <p style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>Personaliza asunto y cuerpo de cada correo</p>
            </div>
          </div>
          <button onClick={() => setShowPlantillas(e => !e)} style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: T.bg, boxShadow: showPlantillas ? "inset 3px 3px 7px #c5cdd8, inset -3px -3px 7px #ffffff" : "4px 4px 10px #c5cdd8, -4px -4px 10px #ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: T.tx2, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showPlantillas ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        {showPlantillas && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            {["Veterinaria", "Cliente"].map(dest => (
              <div key={dest}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6, marginTop: dest === "Cliente" ? 12 : 0 }}>→ Se envía al: {dest}</div>
                {EMAIL_TEMPLATE_META.filter(t => t.dest === dest).map(meta => {
                  const open = expandedTpl === meta.key;
                  return (
                    <div key={meta.key} className="inset" style={{ borderRadius: 14, overflow: "hidden" }}>
                      <button onClick={() => setExpandedTpl(open ? null : meta.key)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{meta.label}</span>
                          {meta.vars !== "—" && <span style={{ fontSize: 10, color: T.tx3, background: T.bg, borderRadius: 6, padding: "2px 7px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{meta.vars}</span>}
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.tx3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {open && (
                        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 5 }}>ASUNTO</label>
                            <input className="input" style={{ fontSize: 13 }} value={getTpl(meta.key, "subject")} onChange={e => setTpl(meta.key, "subject", e.target.value)} placeholder={DEFAULT_EMAIL_TEMPLATES[meta.key]?.subject} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 5 }}>MENSAJE</label>
                            <textarea className="input" rows={3} style={{ resize: "vertical", fontSize: 13 }} value={getTpl(meta.key, "body")} onChange={e => setTpl(meta.key, "body", e.target.value)} placeholder={DEFAULT_EMAIL_TEMPLATES[meta.key]?.body} />
                          </div>
                          <button className="btn" style={{ alignSelf: "flex-start", padding: "5px 14px", fontSize: 11 }} onClick={() => setTpl(meta.key, "subject", DEFAULT_EMAIL_TEMPLATES[meta.key]?.subject) || setTpl(meta.key, "body", DEFAULT_EMAIL_TEMPLATES[meta.key]?.body)}>Restaurar original</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
        <ListaAjuste title="Motivos de Citas" items={motivos} onAdd={v => setMotivos(p => [...p, v])} onRemove={i => setMotivos(p => p.filter((_, j) => j !== i))} expanded={openList === "motivos"} onToggle={() => toggleList("motivos")} />
        <ListaAjuste title="Tratamientos"     items={trats}   onAdd={v => setTrats(p => [...p, v])}   onRemove={i => setTrats(p => p.filter((_, j) => j !== i))}   expanded={openList === "trats"}   onToggle={() => toggleList("trats")} />
        <ListaAjuste title="Medicamentos"     items={meds}    onAdd={v => setMeds(p => [...p, v])}    onRemove={i => setMeds(p => p.filter((_, j) => j !== i))}    expanded={openList === "meds"}    onToggle={() => toggleList("meds")} />
      </div>
    </div>
  );
};

const NotifPermissionBanner = () => {
  const [perm, setPerm] = useState(() => "Notification" in window ? Notification.permission : "denied");
  const [hidden, setHidden] = useState(false);
  if (perm === "granted" || perm === "denied" || hidden) return null;
  const request = async () => {
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === "granted") await initPush();
  };
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000, background: T.surface, boxShadow: T.nmOut, borderRadius: 20, padding: "14px 20px", display: "flex", gap: 12, alignItems: "center", maxWidth: 420, width: "calc(100vw - 32px)", border: "1px solid rgba(63,143,176,0.15)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>{Icons.bell}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>Activar notificaciones push</div>
        <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>Recibe alertas de citas, vacunas y cumpleaños</div>
      </div>
      <button className="btn-primary" style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }} onClick={request}>Activar</button>
      <button className="btn" style={{ padding: "8px 10px", fontSize: 12, flexShrink: 0 }} onClick={() => setHidden(true)}>✕</button>
    </div>
  );
};

// clienteId: si se pasa, filtra solo las mascotas/vacunas de ese cliente (panel cliente)
//            si es null, incluye todas las de la empresa (panel admin)
const usePushEngine = (db, empresa, clienteId = null) => {
  const notifCfg   = empresa?.notificaciones || {};
  const emailCfg   = db.ajustes?.email;
  const notifEmail = notifCfg.notifEmail;
  const emailOn    = !!(notifCfg.emailEnabled && emailCfg?.serviceId && notifEmail);
  const empresaId  = empresa?.id;

  useEffect(() => {
    if (!empresaId) return;
    const pushOn = ("Notification" in window) && Notification.permission === "granted";
    const today  = colDate();
    const mmdd   = today.slice(5);

    // Solo mascotas de esta empresa; si es panel cliente, solo las suyas
    const mascotas = Object.values(db.mascotas || {}).filter(m =>
      m.empresaId === empresaId && (!clienteId || m.clienteId === clienteId)
    );
    // Solo vacunas de esta empresa; si es panel cliente, solo las de sus mascotas
    const mascIds = new Set(mascotas.map(m => m.id));
    const vacunas = Object.values(db.vacunas || {}).filter(v =>
      v.empresaId === empresaId && (!clienteId || mascIds.has(v.mascotaId))
    );

    const clientEmail = (cId) => db.clientes?.[cId]?.email || null;

    if (notifCfg.cumpleanos) {
      mascotas.forEach(masc => {
        if (!masc.fechaCumpleanos || masc.fechaCumpleanos.slice(5) !== mmdd) return;
        const key   = `cumple_${masc.id}`;
        const cli   = db.clientes?.[masc.clienteId];
        const title = `🎂 ¡Hoy cumple años ${masc.nombre}!`;
        const body  = `${masc.nombre} (${masc.especie}) de ${cli ? `${cli.nombres} ${cli.apellidos}` : "un cliente"} festeja hoy. ¡Felicítalo! 🎉`;
        const vars  = { mascota: masc.nombre, especie: masc.especie, cliente: cli ? `${cli.nombres} ${cli.apellidos}` : "un cliente" };
        if (pushOn && !pushAlreadySent(key)) { sendPush(title, body, key); markPushSent(key); }
        // Email → al cliente propietario de la mascota
        const toEmail = clientEmail(masc.clienteId);
        if (emailOn && toEmail && !emailAlreadySent(key)) { sendEmailTpl(emailCfg, toEmail, "cumpleanos", vars); markEmailSent(key); }
      });
    }

    // Días especiales → al cliente; en panel admin se usa notifEmail como recordatorio al equipo
    const specialDays = [
      { mmdd: "07-21", key: "dia_perro",    cfg: "diaPerro",       tplKey: "diaPerro",       title: "🐶 ¡Día Internacional del Perro!", body: "Hoy celebramos a todos los perros del mundo. ¡Dales mucho amor! 🐾" },
      { mmdd: "08-08", key: "dia_gato",     cfg: "diaGato",        tplKey: "diaGato",         title: "🐱 ¡Día Internacional del Gato!", body: "Hoy es el día de los felinos. ¡Mímalo con sus snacks favoritos! 😺" },
      { mmdd: "10-04", key: "dia_animales", cfg: "diasEspeciales",  tplKey: "diasEspeciales",  title: "🌍 Día Mundial de los Animales",  body: "Hoy honramos a todos los animales. ¡Abraza a tu mascota! 🐾" },
    ];
    specialDays.forEach(({ mmdd: d, key, cfg, tplKey, title, body }) => {
      if (mmdd !== d || !notifCfg[cfg]) return;
      if (pushOn && !pushAlreadySent(key)) { sendPush(title, body, key); markPushSent(key); }
      if (emailOn && !emailAlreadySent(key)) {
        const toEmail = clienteId ? clientEmail(clienteId) : notifEmail;
        if (toEmail) sendEmailTpl(emailCfg, toEmail, tplKey, {});
        markEmailSent(key);
      }
    });

    // Día del veterinario → solo panel admin, solo a notifEmail
    if (mmdd === "06-07" && notifCfg.diaVeterinario && !clienteId) {
      const key = "dia_vet";
      if (pushOn && !pushAlreadySent(key)) { sendPush("🩺 ¡Feliz Día del Veterinario!", "Hoy celebramos a quienes cuidan a nuestras mascotas. ¡Gracias! 🩺", key); markPushSent(key); }
      if (emailOn && notifEmail && !emailAlreadySent(key)) { sendEmailTpl(emailCfg, notifEmail, "diaVeterinario", {}); markEmailSent(key); }
    }

    if (notifCfg.vacunas) {
      vacunas.forEach(v => {
        if (!v.proximaDosis) return;
        const diff    = (new Date(v.proximaDosis + "T12:00:00") - new Date()) / 86400000;
        if (diff > 30 || diff < -1) return;
        const key     = `vac_push_${v.id}_${v.proximaDosis}`;
        const masc    = db.mascotas?.[v.mascotaId];
        const nombre  = v.nombre.split(" (")[0];
        const urgente = diff < 0;
        const title   = urgente ? `⚠️ Dosis vencida: ${nombre}` : `💉 Próxima dosis: ${nombre}`;
        const body    = urgente
          ? `La dosis de ${nombre} para ${masc?.nombre || "una mascota"} venció el ${v.proximaDosis}. ¡Agenda una cita!`
          : `${masc?.nombre || "Una mascota"} necesita ${nombre} el ${v.proximaDosis} (en ${Math.round(diff)} días).`;
        const cli  = db.clientes?.[v.clienteId];
        const vars = { mascota: masc?.nombre || "una mascota", medicamento: nombre, proximaDosis: v.proximaDosis, cliente: cli ? `${cli.nombres} ${cli.apellidos}` : "un cliente" };
        if (pushOn && !pushAlreadySent(key)) { sendPush(title, body, key); markPushSent(key); }
        if (emailOn) {
          const toCliente = clientEmail(v.clienteId);
          if (urgente) {
            // Vacuna vencida → al cliente Y a la veterinaria
            if (toCliente && !emailAlreadySent(`${key}_cli`)) { sendEmailTpl(emailCfg, toCliente, "vacunasVencida", vars); markEmailSent(`${key}_cli`); }
            if (notifEmail && !emailAlreadySent(`${key}_vet`)) { sendEmailTpl(emailCfg, notifEmail, "vacunasVencidaVet", vars); markEmailSent(`${key}_vet`); }
          } else {
            // Vacuna próxima → solo al cliente
            if (toCliente && !emailAlreadySent(key)) { sendEmailTpl(emailCfg, toCliente, "vacunas", vars); markEmailSent(key); }
          }
        }
      });
    }
  }, []);
};

const PanelSuperAdmin = ({ onLogout, db, setDb }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("inicio");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportes, setReportes] = useState({});
  const toggleReporte = (empresaId, reportId) =>
    setReportes(prev => ({ ...prev, [empresaId]: { ...(prev[empresaId] || {}), [reportId]: !(prev[empresaId]?.[reportId] ?? true) } }));
  const [userMenu, setUserMenu] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalClave, setModalClave] = useState(false);
  const [perfil, setPerfil] = useState({ nombre: "Super", apellido: "Admin", email: "superadmin@petflow.io", telefono: "" });
  const marcarLeidaSA = (id) => setDb(prev => ({ ...prev, notificaciones: { ...prev.notificaciones, [id]: { ...prev.notificaciones[id], leida: true } } }));
  const marcarTodasSA = () => setDb(prev => { const upd = {}; Object.values(prev.notificaciones || {}).forEach(n => { upd[n.id] = { ...n, leida: true }; }); return { ...prev, notificaciones: upd }; });
  const [modalEmpresa, setModalEmpresa] = useState(null);
  const [modalSede, setModalSede] = useState(null);
  const [modalAdmin, setModalAdmin] = useState(null);
  const [modalCliente, setModalCliente] = useState(null);
  const [modalMascota, setModalMascota] = useState(null);
  const [modalResetClave, setModalResetClave] = useState(null);
  const [modalSuperAdmin, setModalSuperAdmin] = useState(null);
  const [search, setSearch] = useState({ empresas: "", sedes: "", admins: "", clientes: "", superadmins: "" });
  const [showSearch, setShowSearch] = useState({ empresas: false, sedes: false, admins: false, clientes: false, superadmins: false });
  const toggleSearch = (key) => setShowSearch(p => ({ ...p, [key]: !p[key] }));
  const setQ = (key, val) => setSearch(p => ({ ...p, [key]: val }));

  const saveSuperAdmin = (form) => {
    const id = form.id || `sa_${Date.now()}`;
    setDb(prev => ({ ...prev, users: { ...prev.users, [id]: { ...form, id, role: "superadmin" } } }));
    setModalSuperAdmin(null);
    alert("✓ Super Admin guardado");
  };
  const deleteSuperAdmin = (id) => {
    if (Object.keys(db.users || {}).filter(k => db.users[k].role === "superadmin").length <= 1) { alert("Debe existir al menos un Super Admin."); return; }
    if (confirm("¿Eliminar este Super Admin?")) {
      const { [id]: _, ...rest } = db.users;
      setDb(prev => ({ ...prev, users: rest }));
      alert("✓ Super Admin eliminado");
    }
  };
  const saveEmpresa = (form) => { const id = form.id || `emp_${Date.now()}`; setDb(prev => ({ ...prev, empresas: { ...prev.empresas, [id]: { ...form, id } } })); setModalEmpresa(null); alert("✓ Empresa guardada"); };
  const deleteEmpresa = (id) => { if (confirm("¿Eliminar esta empresa?")) { const { [id]: _, ...rest } = db.empresas; setDb(prev => ({ ...prev, empresas: rest })); alert("✓ Empresa eliminada"); } };
  const saveSede = (form) => { const id = form.id || `sede_${Date.now()}`; setDb(prev => ({ ...prev, sedes: { ...prev.sedes, [id]: { ...form, id } } })); setModalSede(null); alert("✓ Sede guardada"); };
  const deleteSede = (id) => { if (confirm("¿Eliminar esta sede?")) { const { [id]: _, ...rest } = db.sedes; setDb(prev => ({ ...prev, sedes: rest })); alert("✓ Sede eliminada"); } };
  const saveAdmin = (form) => { const id = form.id || `admin_${Date.now()}`; setDb(prev => ({ ...prev, adminUsers: { ...prev.adminUsers, [id]: { ...form, id, role: "admin" } } })); setModalAdmin(null); alert("✓ Admin guardado"); };
  const deleteAdmin = (id) => { if (confirm("¿Eliminar este usuario?")) { const { [id]: _, ...rest } = db.adminUsers; setDb(prev => ({ ...prev, adminUsers: rest })); alert("✓ Admin eliminado"); } };
  const saveCliente = (form) => { const id = form.id || `cli_${Date.now()}`; const existing = db.clientes[id]; setDb(prev => ({ ...prev, clientes: { ...prev.clientes, [id]: { ...form, id, role: "cliente", mascotas: existing?.mascotas || [] } } })); setModalCliente(null); alert("✓ Cliente guardado"); };
  const deleteCliente = (id) => { if (confirm("¿Eliminar este cliente?")) { const { [id]: _, ...rest } = db.clientes; setDb(prev => ({ ...prev, clientes: rest })); alert("✓ Cliente eliminado"); } };
  const resetClaveSA = (newPass) => {
    if (modalResetClave.type === "admin") {
      setDb(prev => ({ ...prev, adminUsers: { ...prev.adminUsers, [modalResetClave.id]: { ...prev.adminUsers[modalResetClave.id], password: newPass } } }));
    } else {
      setDb(prev => ({ ...prev, clientes: { ...prev.clientes, [modalResetClave.id]: { ...prev.clientes[modalResetClave.id], password: newPass } } }));
    }
    setModalResetClave(null);
    alert("✓ Clave restablecida");
  };
  const saveMascota = (form) => {
    const id = form.id || `masc_${Date.now()}`;
    setDb(prev => {
      const prevMasc = prev.mascotas || {};
      const cli = prev.clientes[form.clienteId];
      const prevCli = cli || {};
      const mascIds = prevCli.mascotas || [];
      const updatedMascIds = mascIds.includes(id) ? mascIds : [...mascIds, id];
      return {
        ...prev,
        mascotas: { ...prevMasc, [id]: { ...form, id } },
        clientes: { ...prev.clientes, [form.clienteId]: { ...prevCli, mascotas: updatedMascIds } },
      };
    });
    setModalMascota(null);
    alert("✓ Mascota guardada");
  };
  const deleteMascota = (id) => {
    if (!confirm("¿Eliminar esta mascota?")) return;
    const m = db.mascotas[id];
    setDb(prev => {
      const { [id]: _, ...restMasc } = prev.mascotas || {};
      const cli = prev.clientes[m?.clienteId];
      const updatedCli = cli ? { ...cli, mascotas: (cli.mascotas || []).filter(mid => mid !== id) } : cli;
      return { ...prev, mascotas: restMasc, clientes: { ...prev.clientes, ...(updatedCli ? { [m.clienteId]: updatedCli } : {}) } };
    });
    alert("✓ Mascota eliminada");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: T.bg }}>
      <style>{CSS}</style>

      {/* Backdrop móvil */}
      {isMobile && mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,23,0.5)", zIndex: 250, backdropFilter: "blur(2px)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: isMobile ? 240 : (collapsed ? 72 : 240),
        minHeight: "100vh",
        flexShrink: 0,
        background: T.surface,
        boxShadow: "8px 0 28px #c5cdd8, -2px 0 10px #ffffff",
        borderRight: "1px solid rgba(255,255,255,0.7)",
        display: "flex",
        flexDirection: "column",
        padding: (isMobile || !collapsed) ? "24px 16px" : "24px 10px",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        overflow: "hidden",
        zIndex: isMobile ? 300 : "auto",
        transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "width 0.3s ease, padding 0.3s ease, transform 0.3s ease",
      }}>
        {/* f */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", gap: 14, overflow: "hidden" }}>
          <div style={{ width: 54, height: 54, borderRadius: 18, flexShrink: 0, background: T.surface, boxShadow: "9px 9px 20px #c5cdd8, -9px -9px 20px #ffffff", border: "1px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}>
            <LogoImg size={70} />
          </div>
          {(isMobile || !collapsed) && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#2b7c9d", letterSpacing: "-0.3px" }}>Voff App</div>
              <div style={{ fontSize: 11, color: T.tx3, fontWeight: 500, marginTop: 1 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Hamburger — colapsar en desktop / cerrar en mobile */}
        <div
          className="inset"
          onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(c => !c)}
          title={isMobile ? "Cerrar menú" : (collapsed ? "Expandir menú" : "Contraer menú")}
          style={{ padding: "12px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s ease" }}
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round">
            <line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/>
          </svg>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {MENU.map(item => (
            <div
              key={item.id}
              className={`nav-item${tab === item.id ? " nav-item-active" : ""}`}
              onClick={() => { setTab(item.id); if (isMobile) setMobileOpen(false); }}
              title={(!isMobile && collapsed) ? item.label : undefined}
              style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}
            >
              {Icons[item.iconKey]}
              {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ paddingTop: 16, borderTop: "1px solid rgba(197,205,216,0.35)" }}>
          <div
            className="nav-item nav-logout"
            onClick={onLogout}
            title={(!isMobile && collapsed) ? "Cerrar Sesión" : undefined}
            style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}
          >
            {Icons.logout}
            {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>Cerrar Sesión</span>}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: isMobile ? "20px 16px" : 40, overflow: "auto", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button className="btn" style={{ borderRadius: "50%", padding: 0, width: 46, height: 46, flexShrink: 0 }} onClick={() => setMobileOpen(true)}>
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round">
                  <line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/>
                </svg>
              </button>
            )}
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 800, color: T.tx1 }}></h1>
              {!isMobile && <p style={{ color: T.tx3, marginTop: 4, fontSize: 15 }}>Gestión completa del sistema Voff App</p>}
            </div>
          </div>

          {/* Botones topbar derecha */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CampanaNotificaciones notificaciones={Object.fromEntries(Object.entries(db.notificaciones || {}).filter(([,n]) => !n.clienteId && !n.empresaId))} onMarcarLeida={marcarLeidaSA} onMarcarTodas={marcarTodasSA} />
          <div style={{ position: "relative" }}>
            <button
              className="btn"
              style={{ borderRadius: "50%", padding: 0, width: 46, height: 46, flexShrink: 0 }}
              onClick={() => setUserMenu(m => !m)}
              title={perfil.nombre}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>
              </svg>
            </button>

            {userMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setUserMenu(false)} />
                <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 100, padding: 8, minWidth: 190 }}>
                  <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid rgba(197,205,216,0.4)", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{perfil.nombre} {perfil.apellido}</div>
                    <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{perfil.email}</div>
                  </div>
                  <div className="nav-item" style={{ padding: "10px 14px", gap: 10 }} onClick={() => { setModalPerfil(true); setUserMenu(false); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span style={{ fontSize: 13 }}>Editar Perfil</span>
                  </div>
                  <div className="nav-item" style={{ padding: "10px 14px", gap: 10 }} onClick={() => { setModalClave(true); setUserMenu(false); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 13 }}>Cambiar Clave</span>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

      {tab === "inicio" && <TabInicio db={db} perfil={perfil} />}

      {tab === "mascotas" && <TabMascotas db={db} onNueva={() => setModalMascota({})} onEditar={m => setModalMascota(m)} onEliminar={deleteMascota} />}

      {tab === "reportes" && <TabReportes db={db} reportes={reportes} toggleReporte={toggleReporte} />}

      {tab === "ajustes" && <TabAjustes ajustes={db.ajustes} onSave={aj => setDb(prev => ({ ...prev, ajustes: { ...prev.ajustes, ...aj } }))} />}

      {tab === "empresas" && (() => {
        const q = search.empresas.toLowerCase();
        const lista = Object.values(db.empresas).filter(e => !q || e.nombre.toLowerCase().includes(q) || e.nit.toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q));
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch.empresas ? 12 : 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Empresas ({Object.keys(db.empresas).length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => toggleSearch("empresas")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="btn-primary" onClick={() => setModalEmpresa({})}>Nueva Empresa</button>
              </div>
            </div>
            {showSearch.empresas && <div style={{ marginBottom: 20 }}><input className="input" value={search.empresas} onChange={e => setQ("empresas", e.target.value)} placeholder="Buscar por nombre, NIT o email..." autoFocus /></div>}
            <div className="empresa-grid" style={{ gap: 20 }}>
              {lista.map(emp => {
                const nc = emp.notificaciones || {};
                const nActivas = NOTIF_TYPES.filter(t => nc[t.key]).length;
                return (
                  <div key={emp.id} className="card" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: T.tx1, marginBottom: 4 }}>{emp.nombre}</h3>
                      <span className="badge badge-primary">NIT: {emp.nit}</span>
                    </div>
                    <div className="inset" style={{ padding: 14, marginBottom: 14 }}>
                      <div style={{ fontSize: 13, color: T.tx2, lineHeight: 1.8 }}>
                        {emp.telefono && <div><strong>Tel:</strong> {emp.telefono}</div>}
                        {emp.email && <div><strong>Email:</strong> {emp.email}</div>}
                        {emp.direccion && <div><strong>Dir:</strong> {emp.direccion}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ color: T.primary, display: "flex" }}>{Icons.bell}</span>
                      <span style={{ fontSize: 12, color: T.tx3, fontWeight: 600 }}>{nActivas} de {NOTIF_TYPES.length} notificaciones activas</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" style={{ flex: 1 }} onClick={() => setModalEmpresa(emp)}>Editar</button>
                      <button className="btn-danger" onClick={() => deleteEmpresa(emp.id)}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
              {lista.length === 0 && (
                <div className="card" style={{ padding: 40, gridColumn: "1 / -1", textAlign: "center" }}>
                  <p style={{ color: T.tx3, fontSize: 16 }}>{q ? "Sin resultados para la búsqueda" : "No hay empresas creadas aún"}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {tab === "sedes" && (() => {
        const q = search.sedes.toLowerCase();
        const sedesAll = Object.values(db.sedes).filter(s => !q || s.nombre.toLowerCase().includes(q) || (s.direccion || "").toLowerCase().includes(q));
        const byEmpresa = Object.values(db.empresas).map(emp => ({ emp, sedes: sedesAll.filter(s => s.empresaId === emp.id) }));
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch.sedes ? 12 : 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Sedes ({Object.keys(db.sedes).length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => toggleSearch("sedes")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="btn-primary" onClick={() => setModalSede({})} disabled={Object.keys(db.empresas).length === 0}>Nueva Sede</button>
              </div>
            </div>
            {showSearch.sedes && <div style={{ marginBottom: 20 }}><input className="input" value={search.sedes} onChange={e => setQ("sedes", e.target.value)} placeholder="Buscar por nombre o dirección..." autoFocus /></div>}
            {Object.keys(db.empresas).length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Primero debes crear al menos una empresa</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {byEmpresa.map(({ emp, sedes }) => (
                  <div key={emp.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{Icons.empresas}</div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.tx1 }}>{emp.nombre}</span>
                      <span className="badge badge-primary" style={{ marginLeft: "auto" }}>{sedes.length} sede{sedes.length !== 1 ? "s" : ""}</span>
                    </div>
                    {sedes.length === 0 ? (
                      <p style={{ fontSize: 13, color: T.tx3, padding: "8px 4px" }}>Sin sedes{q ? " que coincidan" : " registradas"}</p>
                    ) : sedes.map(sede => (
                      <div key={sede.id} className="inset list-row" style={{ padding: "16px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 3 }}>{sede.nombre}</div>
                          <div style={{ fontSize: 12, color: T.tx3 }}>{sede.direccion && `${sede.direccion}`}{sede.telefono && ` · Tel: ${sede.telefono}`}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalSede(sede)}>Editar</button><button className="btn-danger" onClick={() => deleteSede(sede.id)}>Eliminar</button></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {tab === "admins" && (() => {
        const q = search.admins.toLowerCase();
        const adminsAll = Object.values(db.adminUsers).filter(a => !q || a.nombre.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
        const byEmpresa = Object.values(db.empresas).map(emp => {
          const empAdmins = adminsAll.filter(a => a.empresaId === emp.id);
          const bySede = Object.values(db.sedes).filter(s => s.empresaId === emp.id).map(sede => ({
            sede, admins: empAdmins.filter(a => a.sedeId === sede.id)
          }));
          const sinSede = empAdmins.filter(a => !a.sedeId || !db.sedes[a.sedeId]);
          return { emp, bySede, sinSede };
        });
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch.admins ? 12 : 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Usuarios Admin ({Object.keys(db.adminUsers).length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => toggleSearch("admins")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="btn-primary" onClick={() => setModalAdmin({})} disabled={Object.keys(db.empresas).length === 0}>Nuevo Admin</button>
              </div>
            </div>
            {showSearch.admins && <div style={{ marginBottom: 20 }}><input className="input" value={search.admins} onChange={e => setQ("admins", e.target.value)} placeholder="Buscar por nombre o email..." autoFocus /></div>}
            {Object.keys(db.empresas).length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Primero debes crear al menos una empresa</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {byEmpresa.map(({ emp, bySede, sinSede }) => {
                  const total = bySede.reduce((n, g) => n + g.admins.length, 0) + sinSede.length;
                  return (
                    <div key={emp.id} className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{Icons.empresas}</div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.tx1 }}>{emp.nombre}</span>
                        <span className="badge badge-primary" style={{ marginLeft: "auto" }}>{total} admin{total !== 1 ? "s" : ""}</span>
                      </div>
                      {bySede.map(({ sede, admins: sedAdmins }) => sedAdmins.length === 0 ? null : (
                        <div key={sede.id} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                            <span style={{ color: T.primary }}>{Icons.sedes}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.tx2 }}>{sede.nombre}</span>
                          </div>
                          {sedAdmins.map(admin => (
                            <div key={admin.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{admin.nombre}</div>
                                <div style={{ fontSize: 12, color: T.tx3 }}>{admin.email}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalAdmin(admin)}>Editar</button><button className="btn" onClick={() => setModalResetClave({ id: admin.id, nombre: admin.nombre, type: "admin" })}>Clave</button><button className="btn-danger" onClick={() => deleteAdmin(admin.id)}>Eliminar</button></div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {sinSede.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                            <span style={{ color: T.tx3 }}>{Icons.sedes}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.tx3 }}>Sin sede asignada</span>
                          </div>
                          {sinSede.map(admin => (
                            <div key={admin.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{admin.nombre}</div>
                                <div style={{ fontSize: 12, color: T.tx3 }}>{admin.email}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalAdmin(admin)}>Editar</button><button className="btn" onClick={() => setModalResetClave({ id: admin.id, nombre: admin.nombre, type: "admin" })}>Clave</button><button className="btn-danger" onClick={() => deleteAdmin(admin.id)}>Eliminar</button></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {total === 0 && <p style={{ fontSize: 13, color: T.tx3, padding: "8px 4px" }}>Sin admins{q ? " que coincidan" : " registrados"}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {tab === "superadmins" && (() => {
        const q = search.superadmins.toLowerCase();
        const saList = Object.values(db.users || {}).filter(u => u.role === "superadmin" && (!q || u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)));
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch.superadmins ? 12 : 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Super Admins ({saList.length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => toggleSearch("superadmins")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="btn-primary" onClick={() => setModalSuperAdmin({})}>Nuevo Super Admin</button>
              </div>
            </div>
            {showSearch.superadmins && <div style={{ marginBottom: 20 }}><input className="input" value={search.superadmins} onChange={e => setQ("superadmins", e.target.value)} placeholder="Buscar por nombre o email..." autoFocus /></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {saList.map(sa => (
                <div key={sa.id} className="inset list-row" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="inset" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
                      {Icons.admins}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1 }}>{sa.nombre || "—"}</div>
                      <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>{sa.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => setModalSuperAdmin(sa)}>Editar</button>
                    <button className="btn-danger" onClick={() => deleteSuperAdmin(sa.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
              {saList.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>No hay resultados.</div>}
            </div>
          </div>
        );
      })()}

      {tab === "clientes" && (() => {
        const q = search.clientes.toLowerCase();
        const clientesAll = Object.values(db.clientes).filter(c => !q || `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.celular || "").includes(q));
        const byEmpresa = Object.values(db.empresas).map(emp => {
          const empCli = clientesAll.filter(c => c.empresaId === emp.id);
          const bySede = Object.values(db.sedes).filter(s => s.empresaId === emp.id).map(sede => ({
            sede, clientes: empCli.filter(c => c.sedeId === sede.id)
          }));
          const sinSede = empCli.filter(c => !c.sedeId || !db.sedes[c.sedeId]);
          return { emp, bySede, sinSede };
        });
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearch.clientes ? 12 : 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Clientes ({Object.keys(db.clientes).length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ padding: "10px 14px" }} title="Buscar" onClick={() => toggleSearch("clientes")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button className="btn-primary" onClick={() => setModalCliente({})} disabled={Object.keys(db.empresas).length === 0}>Nuevo Cliente</button>
              </div>
            </div>
            {showSearch.clientes && <div style={{ marginBottom: 20 }}><input className="input" value={search.clientes} onChange={e => setQ("clientes", e.target.value)} placeholder="Buscar por nombre, email o celular..." autoFocus /></div>}
            {Object.keys(db.empresas).length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Primero debes crear al menos una empresa</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {byEmpresa.map(({ emp, bySede, sinSede }) => {
                  const total = bySede.reduce((n, g) => n + g.clientes.length, 0) + sinSede.length;
                  return (
                    <div key={emp.id} className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{Icons.empresas}</div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.tx1 }}>{emp.nombre}</span>
                        <span className="badge badge-success" style={{ marginLeft: "auto" }}>{total} cliente{total !== 1 ? "s" : ""}</span>
                      </div>
                      {bySede.map(({ sede, clientes: sedCli }) => sedCli.length === 0 ? null : (
                        <div key={sede.id} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                            <span style={{ color: T.primary }}>{Icons.sedes}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.tx2 }}>{sede.nombre}</span>
                          </div>
                          {sedCli.map(cli => (
                            <div key={cli.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{cli.nombres} {cli.apellidos}</div>
                                <div style={{ fontSize: 12, color: T.tx3 }}>{cli.email} · {cli.celular}{cli.mascotas?.length > 0 && ` · ${cli.mascotas.length} mascotas`}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalCliente(cli)}>Editar</button><button className="btn" onClick={() => setModalResetClave({ id: cli.id, nombre: `${cli.nombres} ${cli.apellidos}`, type: "cliente" })}>Clave</button><button className="btn-danger" onClick={() => deleteCliente(cli.id)}>Eliminar</button></div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {sinSede.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                            <span style={{ color: T.tx3 }}>{Icons.sedes}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.tx3 }}>Sin sede asignada</span>
                          </div>
                          {sinSede.map(cli => (
                            <div key={cli.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{cli.nombres} {cli.apellidos}</div>
                                <div style={{ fontSize: 12, color: T.tx3 }}>{cli.email} · {cli.celular}{cli.mascotas?.length > 0 && ` · ${cli.mascotas.length} mascotas`}</div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalCliente(cli)}>Editar</button><button className="btn" onClick={() => setModalResetClave({ id: cli.id, nombre: `${cli.nombres} ${cli.apellidos}`, type: "cliente" })}>Clave</button><button className="btn-danger" onClick={() => deleteCliente(cli.id)}>Eliminar</button></div>
                            </div>
                          ))}
                        </div>
                      )}
                      {total === 0 && <p style={{ fontSize: 13, color: T.tx3, padding: "8px 4px" }}>Sin clientes{q ? " que coincidan" : " registrados"}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {modalEmpresa !== null && <ModalEmpresa empresa={modalEmpresa.id ? modalEmpresa : null} onSave={saveEmpresa} onClose={() => setModalEmpresa(null)} />}
      {modalSede !== null && <ModalSede sede={modalSede.id ? modalSede : null} empresas={db.empresas} onSave={saveSede} onClose={() => setModalSede(null)} />}
      {modalAdmin !== null && <ModalUsuarioAdmin usuario={modalAdmin.id ? modalAdmin : null} empresas={db.empresas} sedes={db.sedes} onSave={saveAdmin} onClose={() => setModalAdmin(null)} />}
      {modalCliente !== null && <ModalCliente cliente={modalCliente.id ? modalCliente : null} empresas={db.empresas} sedes={db.sedes} onSave={saveCliente} onClose={() => setModalCliente(null)} />}
      {modalMascota !== null && <ModalMascota mascota={modalMascota.id ? modalMascota : null} clientes={db.clientes} empresas={db.empresas} onSave={saveMascota} onClose={() => setModalMascota(null)} />}
      {modalResetClave && <ModalRestablecerClave userName={modalResetClave.nombre} onSave={resetClaveSA} onClose={() => setModalResetClave(null)} />}
      {modalPerfil && <ModalEditarPerfil perfil={perfil} onSave={data => { setPerfil(data); setModalPerfil(false); alert("✓ Perfil actualizado"); }} onClose={() => setModalPerfil(false)} />}
      {modalClave && <ModalCambiarClave onClose={() => setModalClave(false)} />}
      {modalSuperAdmin !== null && (
        <ModalSuperAdminUser sa={modalSuperAdmin.id ? modalSuperAdmin : null} onSave={saveSuperAdmin} onClose={() => setModalSuperAdmin(null)} />
      )}
      </div>
    </div>
  );
};

const Login = ({ onLogin, db }) => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleLogin = () => {
    const em = email.trim().toLowerCase();
    const superAdm = Object.values(db.users || {}).find(u => u.role === "superadmin" && u.email?.toLowerCase() === em && u.password === password);
    if (superAdm) { onLogin({ role: "superadmin", email: em, id: superAdm.id, nombre: superAdm.nombre }); return; }
    const admin = Object.values(db.adminUsers).find(u => u.email.toLowerCase() === em && u.password === password);
    if (admin) { onLogin({ role: "admin", email: em, id: admin.id, nombre: admin.nombre }); return; }
    const cli = Object.values(db.clientes).find(u => u.email.toLowerCase() === em && u.password === password);
    if (cli) { onLogin({ role: "cliente", email: em, id: cli.id, nombre: `${cli.nombres} ${cli.apellidos}` }); return; }
    setError("Credenciales incorrectas");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: T.bg }}>
      <style>{CSS}</style>
      <div className="card login-card" style={{ width: "100%", maxWidth: 460, padding: "48px 44px" }}>

        {/* Logo + título */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 124, height: 124, borderRadius: 36, background: T.surface, boxShadow: "inset 22px 22px 50px #a8b6c4, inset -22px -22px 50px #ffffff, inset 0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoImg size={160} />
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#2b7c9d" }}>Voff App</h1>
        </div>

        {/* Formulario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>EMAIL</label>
            <input className="input" type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="superadmin@petflow.io" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.tx2, display: "block", marginBottom: 8 }}>CONTRASEÑA</label>
            <input className="input" type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••" />
            <PasswordHint />
          </div>
          {error && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 14, padding: 14, color: T.rose, fontSize: 14, fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%", height: 52, fontSize: 15 }} onClick={handleLogin}>
            Entrar
          </button>
        </div>

        {/* Slogan */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: T.tx3, fontStyle: "italic", lineHeight: 1.6 }}>
            "Cuidar a un animal es cuidar un pedazo de vida que confía en ti sin condiciones."
          </p>
        </div>
      </div>
    </div>
  );
};

const MENU_ADMIN = [
  { id: "inicio",    label: "Inicio",    iconKey: "inicio"    },
  { id: "clientes",  label: "Clientes",  iconKey: "clientes"  },
  { id: "mascotas",  label: "Mascotas",  iconKey: "mascotas"  },
  { id: "historial", label: "Historial", iconKey: "historial" },
  { id: "vacunas",   label: "Vacunas",   iconKey: "vacunas"   },
  { id: "citas",     label: "Citas",     iconKey: "citas"     },
];

const PanelAdmin = ({ auth, onLogout, db, setDb }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("inicio");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalClave, setModalClave] = useState(false);
  const [perfil, setPerfil] = useState({ nombre: auth.nombre || "Admin", apellido: "", email: auth.email, telefono: "" });
  const marcarLeidaAdmin = (id) => setDb(prev => ({ ...prev, notificaciones: { ...prev.notificaciones, [id]: { ...prev.notificaciones[id], leida: true } } }));
  const marcarTodasAdmin = () => setDb(prev => { const upd = {}; Object.values(prev.notificaciones || {}).forEach(n => { upd[n.id] = { ...n, leida: true }; }); return { ...prev, notificaciones: upd }; });
  const [modalCliente, setModalCliente] = useState(null);
  const [modalMascota, setModalMascota] = useState(null);
  const [searchCli, setSearchCli] = useState("");
  const [showSearchCli, setShowSearchCli] = useState(false);
  const [modalResetClaveAdmin, setModalResetClaveAdmin] = useState(null);
  const [modalCita, setModalCita] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [filtroMascotaHist, setFiltroMascotaHist] = useState("");
  const [newHistMascotaId, setNewHistMascotaId] = useState("");
  const [modalVacuna, setModalVacuna] = useState(null);
  const [filtroMascotaVac, setFiltroMascotaVac] = useState("");
  const [filtroSedeC, setFiltroSedeC] = useState("");
  const [filtrEstadoC, setFiltrEstadoC] = useState("");

  const adminData = db.adminUsers[auth.id] || {};
  const empresa = db.empresas[adminData.empresaId];
  usePushEngine(db, empresa);
  const misSedes = Object.values(db.sedes).filter(s => s.empresaId === adminData.empresaId);
  const misClientes = Object.values(db.clientes).filter(c =>
    c.empresaId === adminData.empresaId &&
    (!adminData.sedeId || c.sedeId === adminData.sedeId)
  );
  const misMascotas = Object.values(db.mascotas || {}).filter(m => misClientes.some(c => c.id === m.clienteId));
  const misCitas = Object.values(db.citas || {}).filter(c => c.empresaId === adminData.empresaId && (!adminData.sedeId || !c.sedeId || c.sedeId === adminData.sedeId));
  const citasPorFecha = misCitas.reduce((acc, c) => { if (!acc[c.fecha]) acc[c.fecha] = []; acc[c.fecha].push(c); return acc; }, {});
  const hoyStr = colDate();
  const mesStr = hoyStr.slice(0, 7);
  const nCitasHoy = misCitas.filter(c => c.fecha === hoyStr).length;
  const nCitasMes = misCitas.filter(c => c.fecha.startsWith(mesStr)).length;
  const filteredDb = {
    ...db,
    empresas: empresa ? { [adminData.empresaId]: empresa } : {},
    clientes: Object.fromEntries(misClientes.map(c => [c.id, c])),
    mascotas: Object.fromEntries(misMascotas.map(m => [m.id, m])),
  };
  const defaultValues = { empresaId: adminData.empresaId, sedeId: adminData.sedeId || "" };

  const saveCliente = (form) => {
    const id = form.id || `cli_${Date.now()}`;
    const existing = db.clientes[id];
    setDb(prev => ({ ...prev, clientes: { ...prev.clientes, [id]: { ...form, id, role: "cliente", mascotas: existing?.mascotas || [], empresaId: adminData.empresaId, sedeId: form.sedeId || adminData.sedeId || "" } } }));
    setModalCliente(null);
    alert("✓ Cliente guardado");
  };
  const deleteCliente = (id) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    const { [id]: _, ...rest } = db.clientes;
    setDb(prev => ({ ...prev, clientes: rest }));
    alert("✓ Cliente eliminado");
  };
  const saveMascota = (form) => {
    const id = form.id || `masc_${Date.now()}`;
    setDb(prev => {
      const prevMasc = prev.mascotas || {};
      const cli = prev.clientes[form.clienteId];
      const prevCli = cli || {};
      const mascIds = prevCli.mascotas || [];
      const updatedMascIds = mascIds.includes(id) ? mascIds : [...mascIds, id];
      return { ...prev, mascotas: { ...prevMasc, [id]: { ...form, id } }, clientes: { ...prev.clientes, [form.clienteId]: { ...prevCli, mascotas: updatedMascIds } } };
    });
    setModalMascota(null);
    alert("✓ Mascota guardada");
  };
  const deleteMascota = (id) => {
    if (!confirm("¿Eliminar esta mascota?")) return;
    const m = db.mascotas[id];
    setDb(prev => {
      const { [id]: _, ...restMasc } = prev.mascotas || {};
      const cli = prev.clientes[m?.clienteId];
      const updatedCli = cli ? { ...cli, mascotas: (cli.mascotas || []).filter(mid => mid !== id) } : cli;
      return { ...prev, mascotas: restMasc, clientes: { ...prev.clientes, ...(updatedCli ? { [m.clienteId]: updatedCli } : {}) } };
    });
    alert("✓ Mascota eliminada");
  };
  const citaNotif = (citaForm, tipo) => {
    const hoy = colDate();
    const fmtC = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
    const nId = `notif_cita_${tipo}_${citaForm.id || citaForm.fecha + citaForm.hora}`;
    const msgs = {
      confirmada:   { titulo: "✅ Cita confirmada",    mensaje: `Tu cita del ${fmtC(citaForm.fecha)} a las ${citaForm.hora} — ${citaForm.motivo} — ha sido confirmada. ¡Te esperamos!` },
      cancelada:    { titulo: "❌ Cita cancelada",     mensaje: `Tu cita del ${fmtC(citaForm.fecha)} a las ${citaForm.hora} — ${citaForm.motivo} — fue cancelada. Por favor reagenda cuando gustes.` },
      nueva:        { titulo: "📅 Nueva cita agendada", mensaje: `${db.clientes[citaForm.clienteId]?.nombres || "Un cliente"} agendó una cita para el ${fmtC(citaForm.fecha)} a las ${citaForm.hora}: ${citaForm.motivo}.` },
      reprogramada: { titulo: "📅 Cita reprogramada",  mensaje: `La cita fue reprogramada para el ${fmtC(citaForm.fecha)} a las ${citaForm.hora} — ${citaForm.motivo}.` },
    };
    const m = msgs[tipo];
    if (!m) return null;
    return { [nId]: { id: nId, leida: false, fecha: hoy, tipo: "citas", empresaId: adminData.empresaId, clienteId: citaForm.clienteId, titulo: m.titulo, mensaje: m.mensaje } };
  };
  const saveCita = (form) => {
    const id = form.id || `cita_${Date.now()}`;
    const prevCita = db.citas?.[form.id];
    const hoy = colDate();
    const saved = { ...form, id, empresaId: adminData.empresaId, sedeId: form.sedeId || adminData.sedeId || "", adminId: auth.id };
    let notifs = {};
    if (!prevCita && form.clienteId) {
      const n = citaNotif({ ...saved }, "nueva");
      if (n) notifs = { ...notifs, ...n };
    } else if (prevCita && form.clienteId) {
      const fmtC = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
      const nc = empresa?.notificaciones || {};
      const emailCfg = db.ajustes?.email;
      const cli = db.clientes?.[form.clienteId];
      const vars = { cliente: `${cli?.nombres || ""} ${cli?.apellidos || ""}`.trim(), fecha: fmtC(form.fecha), hora: form.hora, motivo: form.motivo || "" };
      const isReschedule = prevCita.fecha !== form.fecha || prevCita.hora !== form.hora;
      if (isReschedule) {
        const n = citaNotif(saved, "reprogramada");
        if (n) notifs = { ...notifs, ...n };
        if (nc.citas && nc.emailEnabled) {
          if (cli?.email) sendEmailTpl(emailCfg, cli.email, "citaReprogramada", vars);
          if (nc.notifEmail) sendEmailTpl(emailCfg, nc.notifEmail, "citaReprogramadaVet", vars);
        }
      } else if (form.estado !== prevCita.estado) {
        if (form.estado === "confirmada") { const n = citaNotif(saved, "confirmada"); if (n) notifs = { ...notifs, ...n }; }
        if (form.estado === "cancelada")  { const n = citaNotif(saved, "cancelada");  if (n) notifs = { ...notifs, ...n }; }
      }
    }
    setDb(prev => ({ ...prev, citas: { ...(prev.citas || {}), [id]: saved }, notificaciones: { ...(prev.notificaciones || {}), ...notifs } }));
    setModalCita(null);
    alert("✓ Cita guardada");
  };
  const quickChangeCita = (id, newEstado) => {
    const cita = db.citas?.[id];
    if (!cita || cita.estado === newEstado) return;
    const saved = { ...cita, estado: newEstado };
    let notifs = {};
    const nc           = empresa?.notificaciones || {};
    const emailCfg     = db.ajustes?.email;
    const clienteEmail = db.clientes?.[cita.clienteId]?.email;
    const notifEmail   = nc.notifEmail;
    if (cita.clienteId) {
      if (newEstado === "confirmada") {
        const n = citaNotif(saved, "confirmada");
        if (n) notifs = { ...notifs, ...n };
        const vars = { cliente: `${db.clientes?.[cita.clienteId]?.nombres || ""} ${db.clientes?.[cita.clienteId]?.apellidos || ""}`.trim(), fecha: cita.fecha, hora: cita.hora, motivo: cita.motivo || "" };
        if (nc.citas && nc.emailEnabled && clienteEmail) sendEmailTpl(emailCfg, clienteEmail, "citaConfirmada", vars);
      }
      if (newEstado === "cancelada") {
        const n = citaNotif(saved, "cancelada");
        if (n) notifs = { ...notifs, ...n };
        const vars = { cliente: `${db.clientes?.[cita.clienteId]?.nombres || ""} ${db.clientes?.[cita.clienteId]?.apellidos || ""}`.trim(), fecha: cita.fecha, hora: cita.hora, motivo: cita.motivo || "" };
        // Al cliente
        if (nc.citas && nc.emailEnabled && clienteEmail) sendEmailTpl(emailCfg, clienteEmail, "citaCancelada", vars);
        // A la veterinaria
        if (nc.citas && nc.emailEnabled && notifEmail) sendEmailTpl(emailCfg, notifEmail, "citaCanceladaVet", vars);
      }
    }
    setDb(prev => ({ ...prev, citas: { ...prev.citas, [id]: saved }, notificaciones: { ...(prev.notificaciones || {}), ...notifs } }));
  };
  const deleteCita = (id) => {
    if (!confirm("¿Eliminar esta cita permanentemente?")) return;
    setDb(prev => { const { [id]: _, ...rest } = prev.citas || {}; return { ...prev, citas: rest }; });
  };
  const saveHistorialAdmin = (form) => {
    const id = form.id || `hist_${Date.now()}`;
    const masc = db.mascotas[form.mascotaId];
    const hoy = colDate();
    const newNotifs = {};
    (form.medicamentos || []).forEach(med => {
      const obj = typeof med === "string" ? { nombre: med } : med;
      if (!obj.nombre) return;
      const nId = `notif_med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const nombreCorto = obj.nombre.split(" (")[0];
      newNotifs[nId] = {
        id: nId, leida: false, fecha: hoy, tipo: "medicamento",
        empresaId: adminData.empresaId, clienteId: masc?.clienteId || "",
        titulo: `💊 Medicamento para ${masc?.nombre || "mascota"}`,
        mensaje: `${nombreCorto}${obj.dosis ? ` — ${obj.dosis}` : ""}${obj.frecuencia ? `, ${obj.frecuencia.toLowerCase()}` : ""}${obj.duracion ? ` por ${obj.duracion.toLowerCase()}` : ""}.`,
      };
    });
    setDb(prev => ({
      ...prev,
      historialMedico: { ...(prev.historialMedico || {}), [id]: { ...form, id, empresaId: adminData.empresaId, clienteId: masc?.clienteId || "" } },
      notificaciones: { ...prev.notificaciones, ...newNotifs },
    }));
    setModalHistorial(null);
    alert("✓ Registro guardado");
  };
  const deleteHistorialAdmin = (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    setDb(prev => { const { [id]: _, ...rest } = prev.historialMedico || {}; return { ...prev, historialMedico: rest }; });
  };
  const saveVacunaAdmin = (form) => {
    const id = form.id || `vac_${Date.now()}`;
    const masc = db.mascotas[form.mascotaId];
    setDb(prev => ({ ...prev, vacunas: { ...(prev.vacunas || {}), [id]: { ...form, id, empresaId: adminData.empresaId, clienteId: masc?.clienteId || "" } } }));
    setModalVacuna(null);
    alert("✓ Registro guardado");
  };
  const deleteVacunaAdmin = (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    setDb(prev => { const { [id]: _, ...rest } = prev.vacunas || {}; return { ...prev, vacunas: rest }; });
  };
  const resetClaveAdmin = (newPass) => {
    setDb(prev => ({ ...prev, clientes: { ...prev.clientes, [modalResetClaveAdmin.id]: { ...prev.clientes[modalResetClaveAdmin.id], password: newPass } } }));
    setModalResetClaveAdmin(null);
    alert("✓ Clave restablecida");
  };

  const sidebarStyle = {
    width: isMobile ? 240 : (collapsed ? 72 : 240),
    minHeight: "100vh", flexShrink: 0, background: T.surface,
    boxShadow: "8px 0 28px #c5cdd8, -2px 0 10px #ffffff",
    borderRight: "1px solid rgba(255,255,255,0.7)",
    display: "flex", flexDirection: "column",
    padding: (isMobile || !collapsed) ? "24px 16px" : "24px 10px",
    position: isMobile ? "fixed" : "sticky",
    top: 0, left: 0, height: "100vh", overflow: "hidden",
    zIndex: isMobile ? 300 : "auto",
    transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
    transition: "width 0.3s ease, padding 0.3s ease, transform 0.3s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: T.bg }}>
      <style>{CSS}</style>

      {isMobile && mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,23,0.5)", zIndex: 250, backdropFilter: "blur(2px)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <div style={sidebarStyle}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", gap: 14, overflow: "hidden" }}>
          <div style={{ width: 54, height: 54, borderRadius: 18, flexShrink: 0, background: T.surface, boxShadow: "9px 9px 20px #c5cdd8, -9px -9px 20px #ffffff", border: "1px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}>
            <LogoImg size={50} />
          </div>
          {(isMobile || !collapsed) && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.tx1, letterSpacing: "-0.3px" }}>AnimalPet</div>
              <div style={{ fontSize: 11, color: T.tx3, fontWeight: 500, marginTop: 1 }}>{empresa?.nombre || "Panel Admin"}</div>
            </div>
          )}
        </div>
        <div className="inset" onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(c => !c)} style={{ padding: "12px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/></svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {MENU_ADMIN.map(item => (
            <div key={item.id} className={`nav-item${tab === item.id ? " nav-item-active" : ""}`}
              onClick={() => { setTab(item.id); if (isMobile) setMobileOpen(false); }}
              title={(!isMobile && collapsed) ? item.label : undefined}
              style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}>
              {Icons[item.iconKey]}
              {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 16, borderTop: "1px solid rgba(197,205,216,0.35)" }}>
          <div className="nav-item nav-logout" onClick={onLogout}
            title={(!isMobile && collapsed) ? "Cerrar Sesión" : undefined}
            style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}>
            {Icons.logout}
            {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>Cerrar Sesión</span>}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: isMobile ? "20px 16px" : 40, overflow: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button className="btn" style={{ borderRadius: "50%", padding: 0, width: 46, height: 46, flexShrink: 0 }} onClick={() => setMobileOpen(true)}>
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/></svg>
              </button>
            )}
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 800, color: T.tx1 }}>{empresa?.nombre || "Panel Admin"}</h1>
              {!isMobile && <p style={{ color: T.tx3, marginTop: 4, fontSize: 15 }}>Panel de Administrador · {adminData.sedeId && db.sedes[adminData.sedeId] ? db.sedes[adminData.sedeId].nombre : "Todas las sedes"}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CampanaNotificaciones
            notificaciones={Object.fromEntries(Object.entries(db.notificaciones || {}).filter(([, n]) => n.empresaId === adminData.empresaId))}
            onMarcarLeida={marcarLeidaAdmin}
            onMarcarTodas={marcarTodasAdmin}
          />
          <div style={{ position: "relative" }}>
            <button className="btn" style={{ borderRadius: "50%", padding: 0, width: 46, height: 46 }} onClick={() => setUserMenu(m => !m)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>
            </button>
            {userMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setUserMenu(false)} />
                <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 100, padding: 8, minWidth: 190 }}>
                  <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid rgba(197,205,216,0.4)", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{perfil.nombre} {perfil.apellido}</div>
                    <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{perfil.email}</div>
                  </div>
                  <div className="nav-item" style={{ padding: "10px 14px", gap: 10 }} onClick={() => { setModalPerfil(true); setUserMenu(false); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span style={{ fontSize: 13 }}>Editar Perfil</span>
                  </div>
                  <div className="nav-item" style={{ padding: "10px 14px", gap: 10 }} onClick={() => { setModalClave(true); setUserMenu(false); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 13 }}>Cambiar Clave</span>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* ── Inicio ── */}
        {tab === "inicio" && (() => {
          const nCli = misClientes.length;
          const nMasc = misMascotas.length;
          const sede = adminData.sedeId ? db.sedes[adminData.sedeId] : null;
          return (
            <div>
              <div className="card" style={{ padding: "22px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
                <div className="inset" style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: T.tx1 }}>Bienvenido, {perfil.nombre}</h2>
                  <p style={{ fontSize: 13, color: T.tx3, marginTop: 3 }}>
                    {empresa?.nombre}{sede ? ` · ${sede.nombre}` : ""} · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: COL_TZ })}
                  </p>
                </div>
              </div>
              <div className="metrics-grid" style={{ gap: 20, marginBottom: 28 }}>
                <MetricCard icon={Icons.clientes} value={nCli}  label="Mis Clientes"  color={T.primary}   sub={sede ? `Sede: ${sede.nombre}` : "Todas las sedes"} />
                <MetricCard icon={Icons.mascotas} value={nMasc} label="Mis Mascotas"  color="#8b5cf6"     sub={nCli > 0 ? `${(nMasc / nCli).toFixed(1)} por cliente` : "Sin clientes aún"} />
                <MetricCard icon={Icons.citas}    value={nCitasHoy}  label="Citas Hoy"     color={T.emerald}  sub={nCitasHoy === 1 ? "1 cita programada" : `${nCitasHoy} citas programadas`} />
                <MetricCard icon={Icons.citas}    value={nCitasMes}  label="Citas del Mes" color="#f59e0b"   sub={`${mesStr.slice(5) === "01" ? "Enero" : ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mesStr.slice(5))]} ${mesStr.slice(0,4)}`} />
              </div>
              <div className="card" style={{ padding: "22px 28px", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 16 }}>Acciones Rápidas</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn-primary" onClick={() => { setTab("clientes"); setModalCliente({}); }}>+ Nuevo Cliente</button>
                  <button className="btn-success" onClick={() => { setTab("mascotas"); setModalMascota({}); }} disabled={nCli === 0}>+ Nueva Mascota</button>
                  <button className="btn" onClick={() => { setTab("citas"); setModalCita({}); }}>+ Nueva Cita</button>
                </div>
              </div>
              {nCli > 0 && (
                <div className="card" style={{ padding: "22px 28px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 16 }}>Clientes Recientes</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {misClientes.slice(-5).reverse().map(cli => (
                      <div key={cli.id} className="inset" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{cli.nombres} {cli.apellidos}</div>
                          <div style={{ fontSize: 12, color: T.tx3 }}>{cli.email} · {cli.celular}</div>
                        </div>
                        <span className="badge badge-primary">{cli.mascotas?.length || 0} mascota{(cli.mascotas?.length || 0) !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Clientes ── */}
        {tab === "clientes" && (() => {
          const q = searchCli.toLowerCase();
          const lista = misClientes.filter(c => !q || `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.celular || "").includes(q));
          const bySede = misSedes.map(sede => ({ sede, clientes: lista.filter(c => c.sedeId === sede.id) }));
          const sinSede = lista.filter(c => !c.sedeId || !db.sedes[c.sedeId]);
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showSearchCli ? 12 : 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Clientes ({misClientes.length})</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" style={{ padding: "10px 14px" }} onClick={() => setShowSearchCli(s => !s)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  <button className="btn-primary" onClick={() => setModalCliente({})}>Nuevo Cliente</button>
                </div>
              </div>
              {showSearchCli && <div style={{ marginBottom: 20 }}><input className="input" value={searchCli} onChange={e => setSearchCli(e.target.value)} placeholder="Buscar por nombre, email o celular..." autoFocus /></div>}
              {lista.length === 0 && !q ? (
                <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Aún no tienes clientes registrados. ¡Crea el primero!</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {bySede.map(({ sede, clientes: sedCli }) => sedCli.length === 0 ? null : (
                    <div key={sede.id} className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{Icons.sedes}</div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.tx1 }}>{sede.nombre}</span>
                        <span className="badge badge-success" style={{ marginLeft: "auto" }}>{sedCli.length} cliente{sedCli.length !== 1 ? "s" : ""}</span>
                      </div>
                      {sedCli.map(cli => (
                        <div key={cli.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{cli.nombres} {cli.apellidos}</div>
                            <div style={{ fontSize: 12, color: T.tx3 }}>{cli.email} · {cli.celular}{cli.mascotas?.length > 0 && ` · ${cli.mascotas.length} mascotas`}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalCliente(cli)}>Editar</button><button className="btn" onClick={() => setModalResetClaveAdmin({ id: cli.id, nombre: `${cli.nombres} ${cli.apellidos}` })}>Clave</button><button className="btn-danger" onClick={() => deleteCliente(cli.id)}>✕</button></div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {sinSede.length > 0 && (
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(197,205,216,0.35)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.tx3, flexShrink: 0, boxShadow: T.nmSm }}>{Icons.sedes}</div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.tx2 }}>Sin sede asignada</span>
                        <span className="badge" style={{ marginLeft: "auto" }}>{sinSede.length}</span>
                      </div>
                      {sinSede.map(cli => (
                        <div key={cli.id} className="inset list-row" style={{ padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, marginBottom: 2 }}>{cli.nombres} {cli.apellidos}</div>
                            <div style={{ fontSize: 12, color: T.tx3 }}>{cli.email} · {cli.celular}{cli.mascotas?.length > 0 && ` · ${cli.mascotas.length} mascotas`}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={() => setModalCliente(cli)}>Editar</button><button className="btn" onClick={() => setModalResetClaveAdmin({ id: cli.id, nombre: `${cli.nombres} ${cli.apellidos}` })}>Clave</button><button className="btn-danger" onClick={() => deleteCliente(cli.id)}>✕</button></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lista.length === 0 && q && (
                    <div className="card" style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.tx3 }}>Sin resultados para "{searchCli}"</p></div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Mascotas ── */}
        {tab === "mascotas" && (
          <TabMascotas db={filteredDb} onNueva={() => setModalMascota({})} onEditar={m => setModalMascota(m)} onEliminar={deleteMascota} />
        )}

        {/* ── Historial ── */}
        {tab === "historial" && (() => {
          const misHistorial = Object.values(db.historialMedico || {}).filter(h => h.empresaId === adminData.empresaId).sort((a, b) => b.fecha.localeCompare(a.fecha));
          const fmtFecha = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
          const mascotasFiltradas = misMascotas;
          const histFiltrado = filtroMascotaHist ? misHistorial.filter(h => h.mascotaId === filtroMascotaHist) : misHistorial;
          const saveHistorial = (form) => {
            const id = form.id || `hist_${Date.now()}`;
            const masc = db.mascotas[form.mascotaId];
            setDb(prev => ({ ...prev, historialMedico: { ...(prev.historialMedico || {}), [id]: { ...form, id, empresaId: adminData.empresaId, clienteId: masc?.clienteId || "", mascotaId: form.mascotaId || modalHistorial?.mascotaId || "" } } }));
            setModalHistorial(null);
            alert("✓ Registro guardado");
          };
          const deleteHistorial = (id) => { if (confirm("¿Eliminar este registro?")) { setDb(prev => { const { [id]: _, ...rest } = prev.historialMedico || {}; return { ...prev, historialMedico: rest }; }); } };
          const TIPO_COL = { Consulta: T.primary, Vacuna: "#10b981", Cirugía: "#f59e0b", Urgencia: "#f43f5e", Desparasitación: "#8b5cf6", Control: "#0ea5e9", Otro: T.tx3 };
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Historial Médico</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select className="input" style={{ width: "auto", minWidth: 180 }} value={filtroMascotaHist} onChange={e => setFiltroMascotaHist(e.target.value)}>
                    <option value="">Todas las mascotas</option>
                    {mascotasFiltradas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <button className="btn-primary" onClick={() => { setNewHistMascotaId(filtroMascotaHist || ""); setModalHistorial("picker"); }}>+ Nuevo Registro</button>
                </div>
              </div>
              {histFiltrado.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>Sin registros{filtroMascotaHist ? " para esta mascota" : ""}.</div>}
              <div style={{ display: "grid", gap: 14 }}>
                {histFiltrado.map(h => {
                  const masc = db.mascotas[h.mascotaId];
                  const cli  = masc ? db.clientes[masc.clienteId] : null;
                  const col  = TIPO_COL[h.tipo] || T.primary;
                  return (
                    <div key={h.id} className="card" style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: col, background: col + "1a", padding: "4px 12px", borderRadius: 10, border: `1px solid ${col}33` }}>{h.tipo}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: T.tx1 }}>{h.descripcion}</span>
                          {masc && <span style={{ fontSize: 12, color: T.tx3 }}>· {masc.nombre}{cli ? ` (${cli.nombres} ${cli.apellidos})` : ""}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: T.tx3, fontWeight: 600 }}>{fmtFecha(h.fecha)}</span>
                          <button className="btn" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setModalHistorial(h)}>Editar</button>
                          <button className="btn-danger" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => deleteHistorialAdmin(h.id)}>Eliminar</button>
                        </div>
                      </div>
                      <div className="inset" style={{ padding: "14px 18px", borderRadius: 14, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px 24px" }}>
                        {h.veterinario && <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Veterinario: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.veterinario}</span></div>}
                        {h.peso       && <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Peso: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.peso}</span></div>}
                        {h.diagnostico && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Diagnóstico: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.diagnostico}</span></div>}
                        {h.tratamientos?.length > 0 && (
                          <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Tratamientos</span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{h.tratamientos.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 700, background: T.primary + "18", color: T.primary, padding: "3px 10px", borderRadius: 8 }}>{t}</span>)}</div>
                          </div>
                        )}
                        {h.medicamentos?.length > 0 && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Medicamentos</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {h.medicamentos.map((med, i) => {
                                const obj = typeof med === "string" ? { nombre: med } : med;
                                return (
                                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, background: "#10b98118", color: "#10b981", padding: "3px 12px", borderRadius: 8 }}>{obj.nombre.split(" (")[0]}</span>
                                    {obj.dosis && <span style={{ fontSize: 12, color: T.tx2 }}>{obj.dosis}</span>}
                                    {obj.frecuencia && <span style={{ fontSize: 11, color: T.tx3 }}>· {obj.frecuencia}</span>}
                                    {obj.duracion && <span style={{ fontSize: 11, color: T.tx3 }}>· {obj.duracion}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {h.notas && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas: </span><span style={{ fontSize: 13, color: T.tx2 }}>{h.notas}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Vacunas ── */}
        {tab === "vacunas" && (() => {
          const misVacunas = Object.values(db.vacunas || {}).filter(v => v.empresaId === adminData.empresaId).sort((a, b) => b.fecha.localeCompare(a.fecha));
          const fmtFecha = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
          const hoy = colDate();
          const vacFiltradas = filtroMascotaVac ? misVacunas.filter(v => v.mascotaId === filtroMascotaVac) : misVacunas;
          const proximasAlert = misVacunas.filter(v => {
            if (!v.proximaDosis) return false;
            const diff = (new Date(v.proximaDosis + "T12:00:00") - new Date()) / 86400000;
            return diff >= 0 && diff <= 30;
          });
          const vencidas = misVacunas.filter(v => v.proximaDosis && v.proximaDosis < hoy);
          const statusDosis = (proxDosis) => {
            if (!proxDosis) return null;
            const diff = (new Date(proxDosis + "T12:00:00") - new Date()) / 86400000;
            if (diff < 0) return { label: "Vencida", color: "#f43f5e" };
            if (diff <= 7)  return { label: "Urgente", color: "#f43f5e" };
            if (diff <= 30) return { label: "Próxima", color: "#f59e0b" };
            return { label: "Al día", color: "#10b981" };
          };
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Vacunas & Desparasitaciones</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select className="input" style={{ width: "auto", minWidth: 180 }} value={filtroMascotaVac} onChange={e => setFiltroMascotaVac(e.target.value)}>
                    <option value="">Todas las mascotas</option>
                    {misMascotas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <button className="btn-primary" onClick={() => setModalVacuna({ new: true, mascotaId: filtroMascotaVac || "" })}>+ Nuevo Registro</button>
                </div>
              </div>
              {/* Alertas */}
              {(proximasAlert.length > 0 || vencidas.length > 0) && (
                <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                  {vencidas.length > 0 && (
                    <div className="card" style={{ padding: "14px 20px", borderLeft: `4px solid #f43f5e`, display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: "#f43f5e", flexShrink: 0, display: "flex" }}>{Icons.alert}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#f43f5e" }}>{vencidas.length} dosis vencida{vencidas.length > 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 12, color: T.tx3 }}>{vencidas.map(v => `${db.mascotas[v.mascotaId]?.nombre || ""} — ${v.nombre.split(" (")[0]}`).join(", ")}</div>
                      </div>
                    </div>
                  )}
                  {proximasAlert.length > 0 && (
                    <div className="card" style={{ padding: "14px 20px", borderLeft: `4px solid #f59e0b`, display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: "#f59e0b", flexShrink: 0, display: "flex" }}>{Icons.vacunas}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{proximasAlert.length} dosis próxima{proximasAlert.length > 1 ? "s" : ""} (en los próximos 30 días)</div>
                        <div style={{ fontSize: 12, color: T.tx3 }}>{proximasAlert.map(v => `${db.mascotas[v.mascotaId]?.nombre || ""} — ${v.nombre.split(" (")[0]} (${fmtFecha(v.proximaDosis)})`).join(", ")}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {vacFiltradas.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>Sin registros{filtroMascotaVac ? " para esta mascota" : ""}.</div>}
              <div style={{ display: "grid", gap: 12 }}>
                {vacFiltradas.map(v => {
                  const masc = db.mascotas[v.mascotaId];
                  const cli  = masc ? db.clientes[masc.clienteId] : null;
                  const status = statusDosis(v.proximaDosis);
                  const tipoColor = v.tipo === "desparasitacion" ? "#8b5cf6" : T.primary;
                  return (
                    <div key={v.id} className="card" style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                          <div className="inset" style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: tipoColor }}>
                            {v.tipo === "desparasitacion" ? Icons.worm : Icons.vacunas}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: tipoColor, background: tipoColor + "1a", padding: "3px 10px", borderRadius: 8, border: `1px solid ${tipoColor}33` }}>
                                {v.tipo === "desparasitacion" ? "Desparasitación" : "Vacuna"}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{v.nombre.split(" (")[0]}</span>
                              {masc && <span style={{ fontSize: 12, color: T.tx3 }}>· {masc.nombre}{cli ? ` (${cli.nombres})` : ""}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: T.tx2 }}>Aplicada: <strong>{fmtFecha(v.fecha)}</strong></span>
                              {v.proximaDosis && (
                                <span style={{ fontSize: 12, color: status?.color || T.tx2 }}>Próxima dosis: <strong>{fmtFecha(v.proximaDosis)}</strong></span>
                              )}
                              {v.veterinario && <span style={{ fontSize: 12, color: T.tx3 }}>Dr. {v.veterinario.replace(/^Dr\.?\s*/i, "")}</span>}
                              {v.lote && <span style={{ fontSize: 12, color: T.tx3 }}>Lote: {v.lote}</span>}
                            </div>
                            {v.notas && <div style={{ fontSize: 12, color: T.tx3, marginTop: 4 }}>{v.notas}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          {status && <span style={{ fontSize: 11, fontWeight: 800, color: status.color, background: status.color + "18", padding: "4px 12px", borderRadius: 10, border: `1px solid ${status.color}40` }}>{status.label}</span>}
                          <button className="btn" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setModalVacuna(v)}>Editar</button>
                          <button className="btn-danger" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => deleteVacunaAdmin(v.id)}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Citas ── */}
        {tab === "citas" && (() => {
          const hoy = colDate();
          const citasFiltradas = misCitas
            .filter(c => !filtroSedeC || c.sedeId === filtroSedeC)
            .filter(c => !filtrEstadoC || c.estado === filtrEstadoC);
          const citasPorFechaFilt = citasFiltradas.reduce((acc, c) => { if (!acc[c.fecha]) acc[c.fecha] = []; acc[c.fecha].push(c); return acc; }, {});
          const citasVista = selectedDate
            ? (citasPorFechaFilt[selectedDate] || []).sort((a, b) => a.hora.localeCompare(b.hora))
            : [...citasFiltradas].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
          const getEst = (v) => ESTADO_CITA.find(e => e.v === v) || ESTADO_CITA[0];
          const fmtD = (f) => new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
          const nHoy = misCitas.filter(c => c.fecha === hoy).length;
          const nPend = misCitas.filter(c => c.estado === "pendiente" && c.fecha >= hoy).length;
          const nConf = misCitas.filter(c => c.estado === "confirmada" && c.fecha >= hoy).length;
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Citas</h2>
                <button className="btn-primary" onClick={() => setModalCita({})}>+ Nueva Cita</button>
              </div>
              {/* Stats strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Hoy", value: nHoy, color: T.primary },
                  { label: "Pendientes", value: nPend, color: "#f59e0b" },
                  { label: "Confirmadas", value: nConf, color: "#10b981" },
                ].map(s => (
                  <div key={s.label} className="inset" style={{ padding: "14px 16px", borderRadius: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Filters */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {misSedes.length > 1 && (
                  <select className="input" style={{ width: "auto", minWidth: 160 }} value={filtroSedeC} onChange={e => setFiltroSedeC(e.target.value)}>
                    <option value="">Todas las sedes</option>
                    {misSedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                )}
                <select className="input" style={{ width: "auto", minWidth: 150 }} value={filtrEstadoC} onChange={e => setFiltrEstadoC(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {ESTADO_CITA.map(e => <option key={e.v} value={e.v}>{e.l}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: 24, alignItems: "start" }}>
                {/* Calendario */}
                <div>
                  <CalendarioNeuro
                    value={selectedDate}
                    onChange={d => setSelectedDate(prev => prev === d ? null : d)}
                    citasPorFecha={citasPorFechaFilt}
                  />
                  {selectedDate && (
                    <button className="btn" style={{ marginTop: 10, width: "100%", fontSize: 13 }} onClick={() => setSelectedDate(null)}>
                      Ver todas
                    </button>
                  )}
                </div>
                {/* Lista */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tx2, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {selectedDate
                      ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                      : `${citasVista.length} cita${citasVista.length !== 1 ? "s" : ""}`}
                  </div>
                  {citasVista.length === 0 ? (
                    <div className="card" style={{ padding: "40px 28px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: T.tx3 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                      <p style={{ color: T.tx3, fontSize: 13 }}>{selectedDate ? "Sin citas este día" : "No hay citas aún"}</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {citasVista.map(cita => {
                        const cli  = db.clientes[cita.clienteId];
                        const masc = cita.mascotaId ? db.mascotas?.[cita.mascotaId] : null;
                        const est  = getEst(cita.estado);
                        const activa = cita.estado !== "cancelada" && cita.estado !== "completada";
                        return (
                          <div key={cita.id} className="card" style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                                <div className="inset" style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary }}>{Icons.citas}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: T.tx1 }}>{cita.hora} — {cita.motivo}</div>
                                  <div style={{ fontSize: 12, color: T.tx2, fontWeight: 600, marginTop: 2 }}>
                                    {cli ? `${cli.nombres} ${cli.apellidos}` : "—"}{masc ? ` · ${masc.nombre}` : ""}
                                  </div>
                                  {!selectedDate && <div style={{ fontSize: 11, color: T.tx3, marginTop: 1 }}>{fmtD(cita.fecha)}{cita.sedeId && misSedes.length > 1 ? ` · ${db.sedes[cita.sedeId]?.nombre || ""}` : ""}</div>}
                                  {cita.notas && <div style={{ fontSize: 11, color: T.tx3, marginTop: 2, fontStyle: "italic" }}>{cita.notas}</div>}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                                <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${est.c}18`, color: est.c, border: `1px solid ${est.c}40`, whiteSpace: "nowrap" }}>{est.l}</span>
                              </div>
                            </div>
                            {/* Quick actions */}
                            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                              {cita.estado === "pendiente" && (
                                <button className="btn-success" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => quickChangeCita(cita.id, "confirmada")}>✓ Confirmar</button>
                              )}
                              {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
                                <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => quickChangeCita(cita.id, "completada")}>✓ Completada</button>
                              )}
                              {activa && (
                                <button className="btn-danger" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => { if (confirm("¿Cancelar esta cita?")) quickChangeCita(cita.id, "cancelada"); }}>Cancelar</button>
                              )}
                              <button className="btn" style={{ padding: "6px 10px", marginLeft: "auto" }} onClick={() => setModalCita(cita)} title="Editar">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button className="btn" style={{ padding: "6px 10px" }} onClick={() => deleteCita(cita.id)} title="Eliminar">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modals */}
        {modalCliente !== null && (
          <ModalCliente
            cliente={modalCliente.id ? modalCliente : null}
            empresas={empresa ? { [adminData.empresaId]: empresa } : {}}
            sedes={Object.fromEntries(misSedes.map(s => [s.id, s]))}
            onSave={saveCliente}
            onClose={() => setModalCliente(null)}
            defaultValues={defaultValues}
          />
        )}
        {modalMascota !== null && (
          <ModalMascota
            mascota={modalMascota.id ? modalMascota : null}
            clientes={Object.fromEntries(misClientes.map(c => [c.id, c]))}
            empresas={empresa ? { [adminData.empresaId]: empresa } : {}}
            onSave={saveMascota}
            onClose={() => setModalMascota(null)}
            defaultValues={defaultValues}
          />
        )}
        {modalCita !== null && (
          <ModalNuevaCita
            cita={modalCita.id ? modalCita : null}
            clientes={Object.fromEntries(misClientes.map(c => [c.id, c]))}
            mascotas={Object.fromEntries(misMascotas.map(m => [m.id, m]))}
            sedes={Object.fromEntries(misSedes.map(s => [s.id, s]))}
            citasExistentes={misCitas}
            isAdmin
            motivosCitas={db.ajustes?.motivosCitas || []}
            onSave={saveCita}
            onClose={() => setModalCita(null)}
          />
        )}
        {modalResetClaveAdmin && <ModalRestablecerClave userName={modalResetClaveAdmin.nombre} onSave={resetClaveAdmin} onClose={() => setModalResetClaveAdmin(null)} />}
        {modalPerfil && <ModalEditarPerfil perfil={perfil} onSave={data => { setPerfil(data); setModalPerfil(false); alert("✓ Perfil actualizado"); }} onClose={() => setModalPerfil(false)} />}
        {modalClave && <ModalCambiarClave onClose={() => setModalClave(false)} />}
        {/* Historial modals — rendered here to avoid hook-in-callback violations */}
        {modalHistorial === "picker" && (
          <div className="modal-overlay" onClick={() => setModalHistorial(null)}>
            <div className="card modal-inner" style={{ width: "100%", maxWidth: 400, padding: 32 }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.tx1, marginBottom: 20 }}>Seleccionar Mascota</h2>
              <select className="input" style={{ marginBottom: 20 }} value={newHistMascotaId} onChange={e => setNewHistMascotaId(e.target.value)}>
                <option value="">Seleccionar mascota...</option>
                {misMascotas.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>)}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-primary" style={{ flex: 1 }} disabled={!newHistMascotaId}
                  onClick={() => setModalHistorial({ new: true, mascotaId: newHistMascotaId })}>
                  Continuar
                </button>
                <button className="btn" onClick={() => setModalHistorial(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {modalHistorial && modalHistorial !== "picker" && (
          <ModalHistorial
            historial={modalHistorial.new ? null : modalHistorial}
            mascota={db.mascotas[modalHistorial.mascotaId]}
            ajustes={db.ajustes}
            onSave={form => saveHistorialAdmin({ ...form, mascotaId: modalHistorial.mascotaId })}
            onClose={() => setModalHistorial(null)}
          />
        )}
        {modalVacuna && (
          <ModalVacuna
            vacuna={modalVacuna.new ? null : modalVacuna}
            mascota={modalVacuna.mascotaId ? db.mascotas[modalVacuna.mascotaId] : null}
            mascotas={Object.fromEntries(misMascotas.map(m => [m.id, m]))}
            onSave={form => saveVacunaAdmin({ ...form, mascotaId: form.mascotaId || modalVacuna.mascotaId || "" })}
            onClose={() => setModalVacuna(null)}
          />
        )}
      </div>
    </div>
  );
};

const ModalEditarCliente = ({ cliente, onSave, onClose }) => {
  const [form, setForm] = useState({ nombres: cliente.nombres || "", apellidos: cliente.apellidos || "", celular: cliente.celular || "", email: cliente.email || "", direccion: cliente.direccion || "" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => { if (!form.nombres || !form.apellidos) { alert("Nombres y apellidos son obligatorios"); return; } onSave(form); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 520, padding: 32, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>Editar mis datos</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div className="form-grid" style={{ gap: 16 }}>
            <div><label style={LBL}>NOMBRES *</label><input className="input" value={form.nombres} onChange={e => f("nombres", e.target.value)} /></div>
            <div><label style={LBL}>APELLIDOS *</label><input className="input" value={form.apellidos} onChange={e => f("apellidos", e.target.value)} /></div>
          </div>
          <div><label style={LBL}>CELULAR</label><input className="input" value={form.celular} onChange={e => f("celular", e.target.value)} placeholder="+57 300 000 0000" /></div>
          <div><label style={LBL}>EMAIL</label><input className="input" type="email" value={form.email} onChange={e => f("email", e.target.value)} /></div>
          <div><label style={LBL}>DIRECCIÓN</label><input className="input" value={form.direccion} onChange={e => f("direccion", e.target.value)} placeholder="Tu dirección" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>Guardar Cambios</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ModalVacuna = ({ vacuna, mascota, mascotas, onSave, onClose }) => {
  const todosNombres = [...NOMBRES_VACUNAS, ...NOMBRES_DESPARASITANTES];
  const [form, setForm] = useState(vacuna || {
    mascotaId: mascota?.id || "",
    nombre: "", tipo: "vacuna", fecha: colDate(),
    proximaDosis: "", veterinario: "", lote: "", notas: "",
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleNombre = (nombre) => {
    const tipo = NOMBRES_DESPARASITANTES.includes(nombre) ? "desparasitacion" : "vacuna";
    setForm(p => ({ ...p, nombre, tipo }));
  };
  const handleSave = () => {
    if (!form.mascotaId || !form.nombre || !form.fecha) { alert("Mascota, nombre y fecha son obligatorios"); return; }
    onSave(form);
  };
  const mascotasList = mascotas ? Object.values(mascotas) : (mascota ? [mascota] : []);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-inner" style={{ width: "100%", maxWidth: 580, padding: 32, maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: T.tx1 }}>{vacuna ? "Editar registro" : "Nuevo registro"}</h2>
          <button className="btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {mascotasList.length > 1 && (
            <div>
              <label style={LBL}>MASCOTA *</label>
              <select className="input" value={form.mascotaId} onChange={e => f("mascotaId", e.target.value)}>
                <option value="">Seleccionar mascota...</option>
                {mascotasList.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={LBL}>TIPO *</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["vacuna", "desparasitacion"].map(t => (
                <button key={t} className={form.tipo === t ? "btn-primary" : "btn"} style={{ flex: 1, padding: "10px 16px", fontSize: 13 }}
                  onClick={() => f("tipo", t)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>{t === "vacuna" ? Icons.vacunas : Icons.worm}{t === "vacuna" ? "Vacuna" : "Desparasitación"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={LBL}>NOMBRE *</label>
            <select className="input" value={form.nombre} onChange={e => handleNombre(e.target.value)}>
              <option value="">Seleccionar o escribir...</option>
              <optgroup label="— Vacunas —">
                {NOMBRES_VACUNAS.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
              <optgroup label="— Desparasitaciones —">
                {NOMBRES_DESPARASITANTES.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            </select>
            {form.nombre && !todosNombres.includes(form.nombre) && (
              <input className="input" style={{ marginTop: 8 }} value={form.nombre} onChange={e => f("nombre", e.target.value)} placeholder="Nombre personalizado" />
            )}
            {!form.nombre && (
              <input className="input" style={{ marginTop: 8 }} placeholder="O escribe el nombre directamente" onChange={e => handleNombre(e.target.value)} />
            )}
          </div>
          <div className="form-grid" style={{ gap: 16 }}>
            <div>
              <label style={LBL}>FECHA DE APLICACIÓN *</label>
              <input className="input" type="date" value={form.fecha} onChange={e => f("fecha", e.target.value)} />
            </div>
            <div>
              <label style={LBL}>PRÓXIMA DOSIS</label>
              <input className="input" type="date" value={form.proximaDosis} onChange={e => f("proximaDosis", e.target.value)} />
            </div>
            <div>
              <label style={LBL}>VETERINARIO</label>
              <input className="input" value={form.veterinario} onChange={e => f("veterinario", e.target.value)} placeholder="Dr. Apellido" />
            </div>
            <div>
              <label style={LBL}>N° LOTE / PRODUCTO</label>
              <input className="input" value={form.lote} onChange={e => f("lote", e.target.value)} placeholder="Ej: LOT-2026-01" />
            </div>
          </div>
          <div>
            <label style={LBL}>NOTAS</label>
            <textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.notas} onChange={e => f("notas", e.target.value)} placeholder="Observaciones, reacciones, etc." />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{vacuna ? "Guardar Cambios" : "Registrar"}</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const CarnetDigital = ({ mascota, cliente, empresa }) => {
  const edad = mascota.fechaCumpleanos
    ? (() => { const d = new Date(); const b = new Date(mascota.fechaCumpleanos); let y = d.getFullYear() - b.getFullYear(); if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) y--; return y; })()
    : mascota.edad;
  const fmtFecha = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—";
  return (
    <div style={{ width: "100%", maxWidth: 360, borderRadius: 28, overflow: "hidden", background: `linear-gradient(135deg, ${T.primary} 0%, #1a5f7a 100%)`, boxShadow: "16px 16px 40px rgba(63,143,176,0.45), -8px -8px 24px #ffffff", position: "relative" }}>
      {/* decorative circles */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
      {/* header */}
      <div style={{ padding: "22px 24px 16px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, overflow: "hidden", background: "rgba(255,255,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 3px 3px 8px rgba(0,0,0,0.2)" }}>
          {mascota.foto
            ? <img src={mascota.foto} alt={mascota.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "rgba(255,255,255,0.9)", display: "flex" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{mascota.especie === "Gato" ? <><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.26A9.06 9.06 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></> : mascota.especie === "Perro" ? <><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></> : <><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></>}</svg></span>}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>{mascota.nombre}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginTop: 2 }}>{mascota.especie} · {mascota.raza || "Raza mixta"}</div>
        </div>
      </div>
      {/* body */}
      <div style={{ padding: "18px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 18 }}>
          {[
            { l: "Género",     v: mascota.genero || "—" },
            { l: "Edad",       v: edad != null ? `${edad} año${edad !== 1 ? "s" : ""}` : "—" },
            { l: "Nacimiento", v: fmtFecha(mascota.fechaCumpleanos) },
            { l: "Propietario", v: `${cliente.nombres} ${cliente.apellidos}` },
          ].map(({ l, v }) => (
            <div key={l}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 2 }}>Clínica</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{empresa?.nombre || "—"}</div>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>ID: {mascota.id.slice(-6).toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
};

const MENU_CLIENTE = [
  { id: "inicio",    label: "Inicio",    iconKey: "inicio"    },
  { id: "mascotas",  label: "Mascotas",  iconKey: "mascotas"  },
  { id: "historial", label: "Historial", iconKey: "reportes"  },
  { id: "vacunas",   label: "Vacunas",   iconKey: "vacunas"   },
  { id: "agenda",    label: "Agenda",    iconKey: "agenda"    },
  { id: "citas",     label: "Citas",     iconKey: "citas"     },
];

const HIST_TIPO_COLOR = { Consulta: T.primary, Vacuna: "#10b981", Cirugía: "#f59e0b", Urgencia: "#f43f5e", Desparasitación: "#8b5cf6" };

const parseDuracionDias = (dur) => {
  if (!dur) return 7;
  const n = parseInt((dur || "").match(/\d+/)?.[0] || "0");
  if (n > 0) return n;
  if (dur === "Continuo") return 120;
  return 30;
};
const parseFrecuenciaHoras = (freq) => {
  const map = {
    "Una vez al día":    { horas: ["08:00"], cadaN: 1 },
    "Dos veces al día":  { horas: ["08:00", "20:00"], cadaN: 1 },
    "Tres veces al día": { horas: ["07:00", "13:00", "20:00"], cadaN: 1 },
    "Cada 8 horas":      { horas: ["08:00", "16:00", "00:00"], cadaN: 1 },
    "Cada 12 horas":     { horas: ["08:00", "20:00"], cadaN: 1 },
    "Cada 24 horas":     { horas: ["08:00"], cadaN: 1 },
    "Cada 48 horas":     { horas: ["08:00"], cadaN: 2 },
    "Cada 72 horas":     { horas: ["08:00"], cadaN: 3 },
    "Según indicación":  { horas: [], cadaN: 1 },
  };
  return map[freq] || { horas: ["08:00"], cadaN: 1 };
};
const buildMedEventos = (historial, mascotas) => {
  const eventos = {};
  historial.forEach(h => {
    const masc = mascotas[h.mascotaId];
    (h.medicamentos || []).forEach(med => {
      const obj = typeof med === "string" ? { nombre: med } : med;
      if (!obj.nombre) return;
      const dias = parseDuracionDias(obj.duracion);
      const { horas, cadaN } = parseFrecuenciaHoras(obj.frecuencia);
      const base = new Date(h.fecha + "T12:00:00");
      for (let i = 0; i < dias; i++) {
        if (i % cadaN !== 0) continue;
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString("en-CA", { timeZone: COL_TZ });
        if (!eventos[key]) eventos[key] = [];
        (horas.length > 0 ? horas : ["—"]).forEach(hora => {
          eventos[key].push({ tipo: "medicamento", histId: h.id, nombre: obj.nombre.split(" (")[0], dosis: obj.dosis, hora, mascotaNombre: masc?.nombre || "" });
        });
      }
    });
  });
  return eventos;
};

const PanelBasico = ({ auth, onLogout, db, setDb }) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("inicio");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [modalEditCliente, setModalEditCliente] = useState(false);
  const [modalEditMascota, setModalEditMascota] = useState(null);
  const [modalCarnet, setModalCarnet] = useState(null);
  const [modalCita, setModalCita] = useState(null);
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(null);
  const [citaCalDate, setCitaCalDate] = useState(null);

  const cliente = db.clientes[auth.id] || {};
  const empresa = db.empresas[cliente.empresaId] || null;
  usePushEngine(db, empresa, auth.id);
  const misMascotas = Object.values(db.mascotas || {}).filter(m => m.clienteId === auth.id);
  const misCitas = Object.values(db.citas || {}).filter(c => c.clienteId === auth.id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  const misHistorial = Object.values(db.historialMedico || {}).filter(h => h.clienteId === auth.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const hoy = colDate();
  const proxCitas = misCitas.filter(c => c.fecha >= hoy && c.estado !== "cancelada");

  const marcarLeida = (id) => setDb(prev => ({ ...prev, notificaciones: { ...prev.notificaciones, [id]: { ...prev.notificaciones[id], leida: true } } }));
  const marcarTodas = () => setDb(prev => { const upd = {}; Object.values(prev.notificaciones || {}).forEach(n => { upd[n.id] = { ...n, leida: true }; }); return { ...prev, notificaciones: upd }; });
  const notifCliente = Object.fromEntries(Object.entries(db.notificaciones || {}).filter(([, n]) => n.empresaId === cliente.empresaId));

  const saveCliente = (form) => {
    setDb(prev => ({ ...prev, clientes: { ...prev.clientes, [auth.id]: { ...prev.clientes[auth.id], ...form } } }));
    setModalEditCliente(false);
    alert("✓ Datos actualizados");
  };
  const saveMascota = (form) => {
    const id = form.id || `masc_${Date.now()}`;
    setDb(prev => ({ ...prev, mascotas: { ...prev.mascotas, [id]: { ...form, id, clienteId: auth.id, empresaId: cliente.empresaId } } }));
    setModalEditMascota(null);
    alert("✓ Mascota actualizada");
  };
  const saveCita = (form) => {
    const id = form.id || `cita_${Date.now()}`;
    const hoy = colDate();
    const isNew = !form.id;
    const fmtC = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
    const notifs = {};
    const nc = empresa?.notificaciones || {};
    const emailCfg = db.ajustes?.email;
    if (isNew) {
      const nId = `notif_cita_new_${Date.now()}`;
      notifs[nId] = { id: nId, leida: false, fecha: hoy, tipo: "citas", empresaId: cliente.empresaId, clienteId: null,
        titulo: "📅 Nueva cita solicitada",
        mensaje: `${cliente.nombres} ${cliente.apellidos} agendó una cita para el ${fmtC(form.fecha)} a las ${form.hora}: ${form.motivo}.` };
      if (nc.emailEnabled && nc.citas && nc.notifEmail) {
        sendEmailTpl(emailCfg, nc.notifEmail, "citaNueva", { cliente: `${cliente.nombres} ${cliente.apellidos}`, fecha: fmtC(form.fecha), hora: form.hora, motivo: form.motivo });
      }
    } else {
      const prevCita = db.citas?.[form.id];
      if (prevCita && (prevCita.fecha !== form.fecha || prevCita.hora !== form.hora)) {
        const nId = `notif_cita_reprog_${Date.now()}`;
        notifs[nId] = { id: nId, leida: false, fecha: hoy, tipo: "citas", empresaId: cliente.empresaId, clienteId: null,
          titulo: "📅 Cita reprogramada",
          mensaje: `${cliente.nombres} ${cliente.apellidos} reprogramó su cita para el ${fmtC(form.fecha)} a las ${form.hora}: ${form.motivo}.` };
        if (nc.emailEnabled && nc.citas) {
          const vars = { cliente: `${cliente.nombres} ${cliente.apellidos}`, fecha: fmtC(form.fecha), hora: form.hora, motivo: form.motivo };
          if (nc.notifEmail) sendEmailTpl(emailCfg, nc.notifEmail, "citaReprogramadaVet", vars);
          if (cliente.email) sendEmailTpl(emailCfg, cliente.email, "citaReprogramada", vars);
        }
      }
    }
    setDb(prev => ({
      ...prev,
      citas: { ...(prev.citas || {}), [id]: { ...form, id, clienteId: auth.id, empresaId: cliente.empresaId, sedeId: cliente.sedeId || "", estado: isNew ? "pendiente" : (form.estado || "pendiente") } },
      notificaciones: { ...(prev.notificaciones || {}), ...notifs },
    }));
    setModalCita(null);
    alert(isNew ? "✓ Cita solicitada — el veterinario la confirmará pronto" : "✓ Cita reprogramada");
  };
  const cancelarCita = (id) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    const cita = db.citas?.[id];
    const hoy = colDate();
    const fmtC = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
    const nId = `notif_cita_cancel_cli_${id}`;
    const notif = { [nId]: { id: nId, leida: false, fecha: hoy, tipo: "citas", empresaId: cliente.empresaId, clienteId: null,
      titulo: "❌ Cita cancelada por cliente",
      mensaje: `${cliente.nombres} ${cliente.apellidos} canceló su cita del ${fmtC(cita?.fecha)} a las ${cita?.hora || ""}${cita?.motivo ? ` (${cita.motivo})` : ""}.` } };
    const nc = empresa?.notificaciones || {};
    if (nc.emailEnabled && nc.citas) {
      const emailCfg = db.ajustes?.email;
      const vars = { cliente: `${cliente.nombres} ${cliente.apellidos}`, fecha: fmtC(cita?.fecha), hora: cita?.hora || "", motivo: cita?.motivo || "" };
      if (nc.notifEmail) sendEmailTpl(emailCfg, nc.notifEmail, "citaCanceladaVet", vars);
      if (cliente.email) sendEmailTpl(emailCfg, cliente.email, "citaCancelada", vars);
    }
    setDb(prev => ({ ...prev,
      citas: { ...prev.citas, [id]: { ...prev.citas[id], estado: "cancelada" } },
      notificaciones: { ...(prev.notificaciones || {}), ...notif },
    }));
  };

  const medAdminKey = (fecha, histId, hora, nombre) => `${auth.id}_${histId}_${fecha}_${hora}_${nombre}`;

  const toggleMedAdmin = (fecha, histId, hora, nombre) => {
    const k = medAdminKey(fecha, histId, hora, nombre);
    setDb(prev => {
      const cur = { ...(prev.medAdministrados || {}) };
      if (cur[k]) { delete cur[k]; } else { cur[k] = { clienteId: auth.id, fecha, histId, hora, nombre, ts: Date.now() }; }
      return { ...prev, medAdministrados: cur };
    });
  };

  useEffect(() => {
    const historial = Object.values(db.historialMedico || {}).filter(h => h.clienteId === auth.id);
    const medEventos = buildMedEventos(historial, db.mascotas);
    const nowMs = Date.now();
    const notifsPorGenerar = {};
    Object.entries(medEventos).forEach(([fecha, evs]) => {
      evs.forEach(ev => {
        if (ev.hora === "—") return;
        const [hh, mm] = ev.hora.split(":").map(Number);
        const evMs = new Date(`${fecha}T${ev.hora}:00`).getTime();
        if (evMs + 3600000 > nowMs) return; // not yet 1 hour past
        const k = medAdminKey(fecha, ev.histId, ev.hora, ev.nombre);
        if ((db.medAdministrados || {})[k]) return; // already confirmed
        const notifKey = `notif_rem_${k}`;
        if ((db.notificaciones || {})[notifKey]) return; // already notified
        const titulo = `💊 ¿Diste el medicamento?`;
        const mensaje = `${ev.nombre}${ev.dosis ? ` (${ev.dosis})` : ""} programado a las ${ev.hora} para ${ev.mascotaNombre || "tu mascota"} — no fue marcado como administrado.`;
        notifsPorGenerar[notifKey] = { id: notifKey, leida: false, fecha, tipo: "recordatorio_med", empresaId: cliente.empresaId, clienteId: auth.id, titulo, mensaje };
        const nc = empresa?.notificaciones || {};
        if (nc.recordatorioMed) sendPush(titulo, mensaje, `med_rem_${k}`);
        if (nc.recordatorioMed && nc.emailEnabled && cliente.email) sendEmailTpl(db.ajustes?.email, cliente.email, "recordatorioMed", { medicamento: ev.nombre, dosis: ev.dosis ? ` (${ev.dosis})` : "", hora: ev.hora, mascota: ev.mascotaNombre || "tu mascota" });
      });
    });
    if (Object.keys(notifsPorGenerar).length > 0) {
      setDb(prev => ({ ...prev, notificaciones: { ...(prev.notificaciones || {}), ...notifsPorGenerar } }));
    }
  }, [tab]);

  // Check for upcoming vaccine/deworming doses and generate notifications
  useEffect(() => {
    const hoy = colDate();
    const misVacunas = Object.values(db.vacunas || {}).filter(v => v.clienteId === auth.id);
    const notifsPorGenerar = {};
    misVacunas.forEach(v => {
      if (!v.proximaDosis) return;
      const diff = (new Date(v.proximaDosis + "T12:00:00") - new Date()) / 86400000;
      if (diff > 30 || diff < -7) return; // only alert within 30 days ahead or up to 7 days overdue
      const notifKey = `notif_vac_${v.id}_${v.proximaDosis}`;
      if ((db.notificaciones || {})[notifKey]) return;
      const masc = db.mascotas[v.mascotaId];
      const nombre = v.nombre.split(" (")[0];
      const urgente = diff < 0;
      notifsPorGenerar[notifKey] = {
        id: notifKey, leida: false, fecha: hoy,
        tipo: urgente ? "vacuna_vencida" : "vacuna",
        empresaId: cliente.empresaId, clienteId: auth.id,
        titulo: urgente ? `⚠️ Dosis vencida: ${nombre}` : `💉 Próxima dosis: ${nombre}`,
        mensaje: urgente
          ? `La dosis de ${nombre} para ${masc?.nombre || "tu mascota"} venció el ${v.proximaDosis}. Agenda una cita pronto.`
          : `${masc?.nombre || "Tu mascota"} necesita ${nombre} el ${v.proximaDosis} (en ${Math.round(diff)} días).`,
      };
    });
    if (Object.keys(notifsPorGenerar).length > 0) {
      setDb(prev => ({ ...prev, notificaciones: { ...(prev.notificaciones || {}), ...notifsPorGenerar } }));
    }
  }, [tab]);

  const fmtFecha = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const getEstCita = (v) => ESTADO_CITA.find(e => e.v === v) || ESTADO_CITA[0];

  const sidebarStyle = {
    width: isMobile ? 240 : (collapsed ? 72 : 240),
    minHeight: "100vh", flexShrink: 0, background: T.surface,
    boxShadow: "8px 0 28px #c5cdd8, -2px 0 10px #ffffff",
    borderRight: "1px solid rgba(255,255,255,0.7)",
    display: "flex", flexDirection: "column",
    padding: (isMobile || !collapsed) ? "24px 16px" : "24px 10px",
    position: isMobile ? "fixed" : "sticky",
    top: 0, left: 0, height: "100vh", overflow: "hidden",
    zIndex: isMobile ? 300 : "auto",
    transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
    transition: "width 0.3s ease, padding 0.3s ease, transform 0.3s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: T.bg }}>
      <style>{CSS}</style>

      {isMobile && mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,23,0.5)", zIndex: 250, backdropFilter: "blur(2px)" }} onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <div style={sidebarStyle}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", gap: 14, overflow: "hidden" }}>
          <div style={{ width: 54, height: 54, borderRadius: 18, flexShrink: 0, background: T.surface, boxShadow: "9px 9px 20px #c5cdd8, -9px -9px 20px #ffffff", border: "1px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}>
            <LogoImg size={50} />
          </div>
          {(isMobile || !collapsed) && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.tx1, letterSpacing: "-0.3px" }}>AnimalPet</div>
              <div style={{ fontSize: 11, color: T.tx3, fontWeight: 500, marginTop: 1 }}>Portal Cliente</div>
            </div>
          )}
        </div>
        <div className="inset" onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(c => !c)} style={{ padding: "12px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/></svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {MENU_CLIENTE.map(item => (
            <div key={item.id} className={`nav-item${tab === item.id ? " nav-item-active" : ""}`}
              onClick={() => { setTab(item.id); if (isMobile) setMobileOpen(false); }}
              title={(!isMobile && collapsed) ? item.label : undefined}
              style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}>
              {Icons[item.iconKey]}
              {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 16, borderTop: "1px solid rgba(197,205,216,0.35)" }}>
          <div className="nav-item nav-logout" onClick={onLogout}
            title={(!isMobile && collapsed) ? "Cerrar Sesión" : undefined}
            style={{ justifyContent: (!isMobile && collapsed) ? "center" : "flex-start", padding: (!isMobile && collapsed) ? "13px" : "13px 18px" }}>
            {Icons.logout}
            {(isMobile || !collapsed) && <span style={{ whiteSpace: "nowrap" }}>Cerrar Sesión</span>}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: isMobile ? "20px 16px" : 40, overflow: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button className="btn" style={{ borderRadius: "50%", padding: 0, width: 46, height: 46, flexShrink: 0 }} onClick={() => setMobileOpen(true)}>
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="16" y2="1"/><line x1="0" y1="7" x2="16" y2="7"/><line x1="0" y1="13" x2="16" y2="13"/></svg>
              </button>
            )}
            <div>
              <h1 style={{ fontSize: isMobile ? 20 : 32, fontWeight: 800, color: T.tx1 }}>{empresa?.nombre || "Mi Portal"}</h1>
              {!isMobile && <p style={{ color: T.tx3, marginTop: 4, fontSize: 15 }}>Portal del Cliente · {cliente.nombres} {cliente.apellidos}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CampanaNotificaciones notificaciones={notifCliente} onMarcarLeida={marcarLeida} onMarcarTodas={marcarTodas} />
            <div style={{ position: "relative" }}>
              <button className="btn" style={{ borderRadius: "50%", padding: 0, width: 46, height: 46 }} onClick={() => setUserMenu(m => !m)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>
              </button>
              {userMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setUserMenu(false)} />
                  <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", zIndex: 100, padding: 8, minWidth: 200 }}>
                    <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid rgba(197,205,216,0.4)", marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{cliente.nombres} {cliente.apellidos}</div>
                      <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{cliente.email}</div>
                    </div>
                    <div className="nav-item" style={{ padding: "10px 14px", gap: 10 }} onClick={() => { setModalEditCliente(true); setUserMenu(false); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      <span style={{ fontSize: 13 }}>Editar mis datos</span>
                    </div>
                    <div className="nav-item nav-logout" style={{ padding: "10px 14px", gap: 10 }} onClick={onLogout}>
                      {Icons.logout}<span style={{ fontSize: 13 }}>Cerrar Sesión</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── INICIO ── */}
        {tab === "inicio" && (
          <div>
            <div className="card" style={{ padding: "22px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
              <div className="inset" style={{ width: 52, height: 52, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LogoImg size={48} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: T.tx1 }}>Bienvenido, {cliente.nombres}</h2>
                <p style={{ fontSize: 13, color: T.tx3, marginTop: 3 }}>{empresa?.nombre || ""} · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: COL_TZ })}</p>
              </div>
            </div>
            <div className="metrics-grid" style={{ gap: 20, marginBottom: 28 }}>
              <MetricCard icon={Icons.mascotas} value={misMascotas.length} label="Mis Mascotas"    color="#8b5cf6"   sub="registradas" />
              <MetricCard icon={Icons.citas}    value={proxCitas.length}   label="Próximas Citas"  color={T.emerald} sub="pendientes o confirmadas" />
              <MetricCard icon={Icons.reportes} value={misHistorial.length} label="Historial"      color={T.primary} sub="registros médicos" />
            </div>
            {proxCitas.length > 0 && (
              <div className="card" style={{ padding: "20px 24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx1, marginBottom: 14 }}>Próximas citas</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {proxCitas.slice(0, 3).map(c => {
                    const masc = db.mascotas[c.mascotaId];
                    const est = getEstCita(c.estado);
                    return (
                      <div key={c.id} className="inset" style={{ padding: "12px 16px", display: "flex", gap: 14, alignItems: "center", borderRadius: 14 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: est.c, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{c.motivo}</div>
                          <div style={{ fontSize: 11.5, color: T.tx3, marginTop: 2 }}>{fmtFecha(c.fecha)} · {c.hora}{masc ? ` · ${masc.nombre}` : ""}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: est.c, background: est.c + "22", padding: "3px 10px", borderRadius: 10 }}>{est.l}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MASCOTAS ── */}
        {tab === "mascotas" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1, marginBottom: 24 }}>Mis Mascotas</h2>
            {misMascotas.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>No tienes mascotas registradas aún.</div>}
            <div style={{ display: "grid", gap: 20 }}>
              {misMascotas.map(m => (
                <div key={m.id} className="card" style={{ padding: 24, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  <div style={{ width: 88, height: 88, borderRadius: 22, overflow: "hidden", flexShrink: 0, background: T.bg, boxShadow: T.nmSm, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.foto ? <img src={m.foto} alt={m.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: T.primary, display: "flex" }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{m.especie === "Gato" ? <><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.26A9.06 9.06 0 0 1 12 5Z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/></> : m.especie === "Perro" ? <><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.115"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2.115"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></> : <><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></>}</svg></span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.tx1 }}>{m.nombre}</div>
                        <div style={{ fontSize: 13, color: T.tx2, marginTop: 3 }}>{m.especie} · {m.raza || "Raza mixta"} · {m.genero}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setModalCarnet(m)}>Carnet</button>
                        <button className="btn" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setModalEditMascota(m)}>Editar</button>
                      </div>
                    </div>
                    <div className="inset" style={{ padding: "12px 16px", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                      {[["Edad", m.edad != null ? `${m.edad} año${m.edad !== 1 ? "s" : ""}` : "—"], ["Cumpleaños", fmtFecha(m.fechaCumpleanos)]].map(([l, v]) => (
                        <div key={l}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 600 }}>{l}: </span><span style={{ fontSize: 12, fontWeight: 700, color: T.tx2 }}>{v}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === "historial" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1, marginBottom: 24 }}>Historial Médico</h2>
            {misHistorial.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>No hay registros médicos aún.</div>}
            {misMascotas.map(masc => {
              const registros = misHistorial.filter(h => h.mascotaId === masc.id);
              if (registros.length === 0) return null;
              return (
                <div key={masc.id} style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 11, background: T.surface, boxShadow: T.nmSm, display: "flex", alignItems: "center", justifyContent: "center", color: T.primary }}>
                      {masc.especie === "Gato" ? Icons.cat : masc.especie === "Perro" ? Icons.dog : Icons.mascotas}
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 800, color: T.tx1 }}>{masc.nombre}</span>
                  </div>
                  <div style={{ display: "grid", gap: 14 }}>
                    {registros.map(h => {
                      const col = HIST_TIPO_COLOR[h.tipo] || T.primary;
                      return (
                        <div key={h.id} className="card" style={{ padding: "18px 22px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: col, background: col + "1a", padding: "4px 12px", borderRadius: 10, border: `1px solid ${col}33` }}>{h.tipo}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{h.descripcion}</span>
                            </div>
                            <span style={{ fontSize: 12, color: T.tx3, fontWeight: 600, flexShrink: 0 }}>{fmtFecha(h.fecha)}</span>
                          </div>
                          <div className="inset" style={{ padding: "12px 16px", borderRadius: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px 20px" }}>
                            {h.veterinario && <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Veterinario: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.veterinario}</span></div>}
                            {h.peso        && <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Peso: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.peso}</span></div>}
                            {h.diagnostico && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Diagnóstico: </span><span style={{ fontSize: 13, fontWeight: 600, color: T.tx2 }}>{h.diagnostico}</span></div>}
                            {h.tratamientos?.length > 0 && (
                              <div><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>Tratamientos</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{h.tratamientos.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 700, background: T.primary + "18", color: T.primary, padding: "3px 10px", borderRadius: 8 }}>{t}</span>)}</div>
                              </div>
                            )}
                            {h.medicamentos?.length > 0 && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>Medicamentos recetados</span>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {h.medicamentos.map((med, i) => {
                                    const obj = typeof med === "string" ? { nombre: med } : med;
                                    return (
                                      <div key={i} className="inset" style={{ padding: "10px 14px", borderRadius: 12 }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "#10b981", marginBottom: obj.dosis || obj.frecuencia ? 6 : 0 }}>{obj.nombre.split(" (")[0]}</div>
                                        {(obj.dosis || obj.frecuencia || obj.duracion) && (
                                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                            {obj.dosis      && <span style={{ fontSize: 12, color: T.tx2, display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-flex" }}>{Icons.pill}</span><strong>Dosis:</strong> {obj.dosis}</span>}
                                            {obj.frecuencia && <span style={{ fontSize: 12, color: T.tx2, display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-flex" }}>{Icons.clock}</span><strong>Frecuencia:</strong> {obj.frecuencia}</span>}
                                            {obj.duracion   && <span style={{ fontSize: 12, color: T.tx2, display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-flex" }}>{Icons.citas}</span><strong>Duración:</strong> {obj.duracion}</span>}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {h.notas && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 11, color: T.tx3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Notas: </span><span style={{ fontSize: 13, color: T.tx2 }}>{h.notas}</span></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── VACUNAS ── */}
        {tab === "vacunas" && (() => {
          const misVacunas = Object.values(db.vacunas || {}).filter(v => v.clienteId === auth.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
          const hoy = colDate();
          const fmtF = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—";
          const statusDosis = (proxDosis) => {
            if (!proxDosis) return null;
            const diff = (new Date(proxDosis + "T12:00:00") - new Date()) / 86400000;
            if (diff < 0) return { label: "Vencida", color: "#f43f5e", bg: "#f43f5e18" };
            if (diff <= 7)  return { label: "Urgente", color: "#f43f5e", bg: "#f43f5e18" };
            if (diff <= 30) return { label: `En ${Math.round(diff)} días`, color: "#f59e0b", bg: "#f59e0b18" };
            return { label: "Al día", color: "#10b981", bg: "#10b98118" };
          };
          const vacunas = misVacunas.filter(v => v.tipo !== "desparasitacion");
          const desparasitaciones = misVacunas.filter(v => v.tipo === "desparasitacion");
          const proximasAlerta = misVacunas.filter(v => {
            if (!v.proximaDosis) return false;
            const diff = (new Date(v.proximaDosis + "T12:00:00") - new Date()) / 86400000;
            return diff <= 30;
          });

          const renderLista = (lista, titulo) => lista.length === 0 ? null : (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>{titulo}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lista.map(v => {
                  const masc = db.mascotas[v.mascotaId];
                  const status = statusDosis(v.proximaDosis);
                  const tipoColor = v.tipo === "desparasitacion" ? "#8b5cf6" : T.primary;
                  return (
                    <div key={v.id} className="card" style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div className="inset" style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: tipoColor }}>
                          {v.tipo === "desparasitacion" ? Icons.worm : Icons.vacunas}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{v.nombre.split(" (")[0]}</div>
                              {masc && <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>Para: {masc.nombre}</div>}
                            </div>
                            {status && (
                              <span style={{ fontSize: 11, fontWeight: 800, color: status.color, background: status.bg, padding: "4px 12px", borderRadius: 10, border: `1px solid ${status.color}40`, flexShrink: 0 }}>{status.label}</span>
                            )}
                          </div>
                          <div className="inset" style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Aplicada</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{fmtF(v.fecha)}</div>
                            </div>
                            {v.proximaDosis && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Próxima dosis</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: status?.color || T.tx1 }}>{fmtF(v.proximaDosis)}</div>
                              </div>
                            )}
                            {v.veterinario && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Veterinario</div>
                                <div style={{ fontSize: 12, color: T.tx2, fontWeight: 600 }}>{v.veterinario}</div>
                              </div>
                            )}
                            {v.lote && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Lote / Producto</div>
                                <div style={{ fontSize: 12, color: T.tx2, fontWeight: 600 }}>{v.lote}</div>
                              </div>
                            )}
                          </div>
                          {v.notas && <div style={{ fontSize: 12, color: T.tx3, marginTop: 8 }}>{v.notas}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );

          return (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1, marginBottom: 20 }}>Vacunas & Desparasitaciones</h2>
              {proximasAlerta.length > 0 && (
                <div className="card" style={{ padding: "14px 20px", marginBottom: 24, borderLeft: `4px solid #f59e0b`, display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ flexShrink: 0, color: "#f59e0b", display: "inline-flex" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg></span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", marginBottom: 4 }}>Tienes {proximasAlerta.length} dosis próxima{proximasAlerta.length > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 12, color: T.tx3 }}>
                      {proximasAlerta.map(v => {
                        const masc = db.mascotas[v.mascotaId];
                        const diff = Math.round((new Date(v.proximaDosis + "T12:00:00") - new Date()) / 86400000);
                        return `${masc?.nombre || ""} — ${v.nombre.split(" (")[0]} ${diff < 0 ? "(vencida)" : `(${fmtF(v.proximaDosis)})`}`;
                      }).join(" · ")}
                    </div>
                  </div>
                </div>
              )}
              {misVacunas.length === 0 && (
                <div className="inset" style={{ padding: "40px 24px", borderRadius: 18, textAlign: "center" }}>
                  <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg></div>
                  <p style={{ fontSize: 13, color: T.tx3 }}>No hay registros de vacunas ni desparasitaciones aún.</p>
                </div>
              )}
              {renderLista(vacunas, "Vacunas")}
              {renderLista(desparasitaciones, "Desparasitaciones")}
            </div>
          );
        })()}

        {/* ── AGENDA ── */}
        {tab === "agenda" && (() => {
          const medEventos = buildMedEventos(misHistorial, db.mascotas);
          const citasPorFechaCliente = misCitas.reduce((acc, c) => { if (!acc[c.fecha]) acc[c.fecha] = []; acc[c.fecha].push(c); return acc; }, {});
          // Combined dot map for calendar
          const todosPorFecha = { ...citasPorFechaCliente };
          Object.keys(medEventos).forEach(d => { if (!todosPorFecha[d]) todosPorFecha[d] = []; todosPorFecha[d] = [...(todosPorFecha[d] || []), ...medEventos[d]]; });

          const fechaVista = selectedAgendaDate || hoy;
          const citasDia = (citasPorFechaCliente[fechaVista] || []).filter(c => c.estado !== "cancelada").sort((a, b) => a.hora.localeCompare(b.hora));
          const medsDia  = (medEventos[fechaVista] || []).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

          const fmtDia = (f) => new Date(f + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          const getEst = (v) => ESTADO_CITA.find(e => e.v === v) || ESTADO_CITA[0];

          return (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1, marginBottom: 24 }}>Mi Agenda</h2>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: 24, alignItems: "start" }}>

                {/* Calendario */}
                <div>
                  <CalendarioNeuro
                    value={selectedAgendaDate}
                    onChange={d => setSelectedAgendaDate(prev => prev === d ? null : d)}
                    citasPorFecha={todosPorFecha}
                  />
                  {selectedAgendaDate && (
                    <button className="btn" style={{ marginTop: 10, width: "100%", fontSize: 13 }} onClick={() => setSelectedAgendaDate(null)}>
                      Volver a hoy
                    </button>
                  )}
                </div>

                {/* Detalle del día */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                      {selectedAgendaDate ? "Seleccionado" : "Hoy"}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.tx1, textTransform: "capitalize" }}>{fmtDia(fechaVista)}</div>
                  </div>

                  {/* Citas del día */}
                  {citasDia.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Citas</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {citasDia.map(c => {
                          const masc = db.mascotas[c.mascotaId];
                          const est  = getEst(c.estado);
                          return (
                            <div key={c.id} className="card" style={{ padding: "14px 18px", display: "flex", gap: 14, alignItems: "center" }}>
                              <div className="inset" style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary }}>{Icons.citas}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.tx1 }}>{c.motivo}</div>
                                <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>{c.hora}{masc ? ` · ${masc.nombre}` : ""}</div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: est.c, background: est.c + "22", padding: "3px 10px", borderRadius: 10, flexShrink: 0 }}>{est.l}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Medicamentos del día */}
                  {medsDia.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Medicamentos</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {medsDia.map((ev, i) => {
                          const k = medAdminKey(fechaVista, ev.histId, ev.hora, ev.nombre);
                          const dado = !!(db.medAdministrados || {})[k];
                          return (
                            <div key={i} className="card" style={{ padding: "14px 18px", display: "flex", gap: 14, alignItems: "center", opacity: dado ? 0.75 : 1, transition: "opacity 0.2s" }}>
                              <div className="inset" style={{ width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.emerald }}>{Icons.pill}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: dado ? T.tx3 : "#10b981", textDecoration: dado ? "line-through" : "none" }}>{ev.nombre}</div>
                                <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>
                                  {ev.mascotaNombre && <span>{ev.mascotaNombre} · </span>}
                                  {ev.dosis && <span>{ev.dosis} · </span>}
                                  {ev.hora !== "—" ? <span style={{ fontWeight: 700, color: T.tx2 }}>{ev.hora}</span> : <span>Hora según indicación</span>}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                {ev.hora !== "—" && (
                                  <div className="inset" style={{ padding: "6px 14px", borderRadius: 12 }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.primary }}>{ev.hora}</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => toggleMedAdmin(fechaVista, ev.histId, ev.hora, ev.nombre)}
                                  title={dado ? "Marcar como no administrado" : "Marcar como administrado"}
                                  style={{
                                    width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                                    background: dado ? `linear-gradient(135deg, ${T.emerald}, #34d399)` : T.surface,
                                    boxShadow: dado ? `4px 4px 10px rgba(16,185,129,0.35), -4px -4px 10px #ffffff` : T.nmSm,
                                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s",
                                    color: dado ? "white" : T.tx3, fontSize: 16,
                                  }}
                                >
                                  {dado ? "✓" : "○"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {citasDia.length === 0 && medsDia.length === 0 && (
                    <div className="inset" style={{ padding: "28px 20px", borderRadius: 18, textAlign: "center" }}>
                      <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
                      <p style={{ fontSize: 13, color: T.tx3, fontWeight: 500 }}>Sin eventos para este día</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── CITAS ── */}
        {tab === "citas" && (() => {
          const citasPorFechaCliente = misCitas.reduce((acc, c) => { if (!acc[c.fecha]) acc[c.fecha] = []; acc[c.fecha].push(c); return acc; }, {});
          const citasVistaCal = citaCalDate
            ? (citasPorFechaCliente[citaCalDate] || []).sort((a, b) => a.hora.localeCompare(b.hora))
            : proxCitas;
          const past = misCitas.filter(c => (c.fecha < hoy || c.estado === "cancelada") && !(c.fecha >= hoy && c.estado !== "cancelada"));
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.tx1 }}>Mis Citas</h2>
                <button className="btn-primary" onClick={() => setModalCita({})}>+ Nueva Cita</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 24, alignItems: "start" }}>
                {/* Calendario */}
                <div>
                  <CalendarioNeuro
                    value={citaCalDate}
                    onChange={d => setCitaCalDate(prev => prev === d ? null : d)}
                    citasPorFecha={citasPorFechaCliente}
                  />
                  {citaCalDate && (
                    <button className="btn" style={{ marginTop: 10, width: "100%", fontSize: 13 }} onClick={() => setCitaCalDate(null)}>Ver próximas</button>
                  )}
                </div>
                {/* Lista */}
                <div>
                  {citaCalDate ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.tx2, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {new Date(citaCalDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Próximas</div>
                  )}
                  {citasVistaCal.length === 0 ? (
                    <div className="inset" style={{ padding: "28px 20px", borderRadius: 16, textAlign: "center" }}>
                      <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                      <p style={{ fontSize: 13, color: T.tx3 }}>{citaCalDate ? "Sin citas este día" : "No tienes citas próximas"}</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {citasVistaCal.map(c => {
                        const masc = db.mascotas[c.mascotaId];
                        const est  = getEstCita(c.estado);
                        const activa = c.estado !== "cancelada" && c.estado !== "completada";
                        return (
                          <div key={c.id} className="card" style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                              <div className="inset" style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.primary }}>
                                {Icons.citas}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.tx1 }}>{c.motivo}</div>
                                <div style={{ fontSize: 12, color: T.tx3, marginTop: 3 }}>
                                  {fmtFecha(c.fecha)} · {c.hora}
                                </div>
                                {c.notas && <div style={{ fontSize: 11, color: T.tx3, marginTop: 2, fontStyle: "italic" }}>{c.notas}</div>}
                              </div>
                              {masc && <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, background: T.primary + "1a", padding: "4px 10px", borderRadius: 10, flexShrink: 0 }}>{masc.nombre}</span>}
                              <span style={{ fontSize: 11, fontWeight: 800, color: est.c, background: est.c + "22", padding: "4px 12px", borderRadius: 10, flexShrink: 0 }}>{est.l}</span>
                            </div>
                            {activa && (
                              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                <button className="btn" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setModalCita(c)}>Reprogramar</button>
                                <button className="btn-danger" style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => cancelarCita(c.id)}>Cancelar</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Historial */}
                  {past.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.tx3, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Historial</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {past.map(c => {
                          const masc = db.mascotas[c.mascotaId];
                          const est  = getEstCita(c.estado);
                          return (
                            <div key={c.id} className="inset" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", borderRadius: 14 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: est.c, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx1 }}>{c.motivo}</div>
                                <div style={{ fontSize: 11.5, color: T.tx3, marginTop: 2 }}>{fmtFecha(c.fecha)} · {c.hora}</div>
                              </div>
                              {masc && <span style={{ fontSize: 10, fontWeight: 800, color: T.primary, background: T.primary + "1a", padding: "3px 8px", borderRadius: 8, flexShrink: 0 }}>{masc.nombre}</span>}
                              <span style={{ fontSize: 11, fontWeight: 700, color: est.c }}>{est.l}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {misCitas.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: T.tx3 }}>No tienes citas registradas aún.</div>}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Modals ── */}
      {modalEditCliente && <ModalEditarCliente cliente={cliente} onSave={saveCliente} onClose={() => setModalEditCliente(false)} />}
      {modalEditMascota && (
        <ModalMascota
          mascota={modalEditMascota.id ? modalEditMascota : null}
          clientes={db.clientes}
          empresas={db.empresas}
          onSave={saveMascota}
          onClose={() => setModalEditMascota(null)}
          defaultValues={{ clienteId: auth.id, empresaId: cliente.empresaId }}
        />
      )}
      {modalCarnet && (
        <div className="modal-overlay" onClick={() => setModalCarnet(null)}>
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <CarnetDigital mascota={modalCarnet} cliente={cliente} empresa={empresa} />
            <button className="btn" onClick={() => setModalCarnet(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {modalCita && (
        <ModalNuevaCita
          cita={modalCita.id ? modalCita : null}
          clientes={{ [auth.id]: db.clientes[auth.id] }}
          mascotas={Object.fromEntries(misMascotas.map(m => [m.id, m]))}
          citasExistentes={misCitas}
          motivosCitas={db.ajustes?.motivosCitas || []}
          onSave={saveCita}
          onClose={() => setModalCita(null)}
        />
      )}
    </div>
  );
};

const PawPrint = ({ color = "currentColor", size = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    <ellipse cx="50" cy="70" rx="24" ry="20" />
    <ellipse cx="22" cy="46" rx="11" ry="14" transform="rotate(-15 22 46)" />
    <ellipse cx="40" cy="36" rx="11" ry="14" transform="rotate(-5 40 36)" />
    <ellipse cx="60" cy="36" rx="11" ry="14" transform="rotate(5 60 36)" />
    <ellipse cx="78" cy="46" rx="11" ry="14" transform="rotate(15 78 46)" />
  </svg>
);

const SPLASH_PAWS = [
  { left: "-4%",  top: "-4%", size: 220, rot: -22, delay: 0    },
  { left: "68%",  top: "-6%", size: 190, rot: 28,  delay: 180  },
  { left: "35%",  top: "4%",  size: 160, rot: -8,  delay: 360  },
  { left: "-6%",  top: "30%", size: 240, rot: 32,  delay: 540  },
  { left: "78%",  top: "16%", size: 210, rot: -32, delay: 720  },
  { left: "22%",  top: "24%", size: 175, rot: 14,  delay: 900  },
  { left: "52%",  top: "34%", size: 230, rot: -18, delay: 1080 },
  { left: "6%",   top: "56%", size: 200, rot: 38,  delay: 1260 },
  { left: "80%",  top: "50%", size: 215, rot: -26, delay: 1440 },
  { left: "38%",  top: "50%", size: 250, rot: 8,   delay: 1620 },
  { left: "62%",  top: "66%", size: 185, rot: -12, delay: 1800 },
  { left: "12%",  top: "74%", size: 225, rot: 24,  delay: 1980 },
  { left: "44%",  top: "78%", size: 170, rot: -36, delay: 2160 },
  { left: "74%",  top: "80%", size: 205, rot: 18,  delay: 2340 },
];

const LoadingScreen = () => {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current) ref.current.style.animation = "loaderFadeOut 0.7s ease forwards";
    }, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "linear-gradient(135deg, #2b7c9d 0%, #1a5f7a 100%)", overflow: "hidden", fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes pawPop {
          0%   { opacity: 0; transform: scale(0) rotate(var(--r)); }
          65%  { opacity: 0.32; transform: scale(1.18) rotate(var(--r)); }
          100% { opacity: 0.22; transform: scale(1) rotate(var(--r)); }
        }
        @keyframes loaderFadeOut { to { opacity: 0; } }
        @keyframes logoPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes dotBlink { 0%,80%,100% { opacity: 0; } 40% { opacity: 1; } }
      `}</style>
      {SPLASH_PAWS.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.left, top: p.top,
          width: p.size, height: p.size, opacity: 0,
          animation: `pawPop 0.55s cubic-bezier(0.34,1.56,0.64,1) ${p.delay}ms forwards`,
          "--r": `${p.rot}deg`,
        }}>
          <PawPrint color="rgba(255,255,255,0.26)" size={p.size} />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, zIndex: 10 }}>
        <div style={{ animation: "logoPulse 1.8s ease-in-out infinite" }}>
          <PawPrint color="white" size={80} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: "white", letterSpacing: "-0.5px", textShadow: "0 2px 16px rgba(0,0,0,0.2)" }}>Voff App</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            Miau Miau
            {[0,1,2].map(i => <span key={i} style={{ animation: `dotBlink 1.4s ease ${i*0.22}s infinite`, display: "inline-block" }}>.</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PetFlow() {
  const [auth, setAuth]     = useState(null);
  const [db, setDb]         = useState(INITIAL_DB);
  const [dbReady, setDbReady] = useState(false);
  const [minDone, setMinDone] = useState(false);
  const syncTimer  = useRef(null);
  const fromRemote = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 3700);
    return () => clearTimeout(t);
  }, []);

  // Carga inicial + escucha cambios en tiempo real desde Firestore
  useEffect(() => {
    initPush();
    const unsub = onSnapshot(DB_REF, (snap) => {
      if (snap.exists()) {
        fromRemote.current = true;
        const remote = snap.data();
        setDb({
          ...remote,
          ajustes: { ...INITIAL_DB.ajustes, ...remote.ajustes },
        });
      } else {
        // Primera vez: siembra la BD con los datos iniciales
        setDoc(DB_REF, INITIAL_DB);
      }
      setDbReady(true);
    }, () => {
      // Si Firestore falla, trabaja en memoria
      setDbReady(true);
    });
    return () => unsub();
  }, []);

  // Cada vez que db cambia por una acción local, sincroniza a Firestore (debounce 1 s)
  useEffect(() => {
    if (!dbReady || fromRemote.current) { fromRemote.current = false; return; }
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setDoc(DB_REF, db).catch(() => {}), 1000);
  }, [db, dbReady]);

  if (!dbReady || !minDone) return <LoadingScreen />;

  return (
    <>
      <NotifPermissionBanner />
      {!auth && <Login onLogin={setAuth} db={db} />}
      {auth?.role === "superadmin" && <PanelSuperAdmin onLogout={() => setAuth(null)} db={db} setDb={setDb} />}
      {auth?.role === "admin"      && <PanelAdmin auth={auth} onLogout={() => setAuth(null)} db={db} setDb={setDb} />}
      {auth?.role === "cliente"    && <PanelBasico auth={auth} onLogout={() => setAuth(null)} db={db} setDb={setDb} />}
    </>
  );
}
