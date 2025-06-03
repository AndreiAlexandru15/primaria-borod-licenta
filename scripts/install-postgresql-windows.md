# Instalare PostgreSQL Client Tools pe Windows

Pentru a utiliza funcționalitatea de backup în aplicația E-Registratură, trebuie să instalezi PostgreSQL client tools pe Windows.

## Opțiunea 1: Instalare PostgreSQL completă (Recomandată)

1. **Descarcă PostgreSQL:**
   - Mergi la https://www.postgresql.org/download/windows/
   - Descarcă ultima versiune stabilă (PostgreSQL 16.x)

2. **Instalează PostgreSQL:**
   - Rulează installer-ul descărcat
   - În timpul instalării, poți dezelecta "PostgreSQL Server" dacă vrei doar client tools
   - Asigură-te că "Command Line Tools" este selectat
   - Continuă cu instalarea

3. **Configurează PATH:**
   - Deschide "Environment Variables" (Win + R → sysdm.cpl → Advanced → Environment Variables)
   - În "System Variables", găsește și editează "Path"
   - Adaugă calea către PostgreSQL bin (de obicei: `C:\Program Files\PostgreSQL\16\bin`)
   - Apasă OK pentru a salva

4. **Verifică instalarea:**
   ```cmd
   pg_dump --version
   ```

## Opțiunea 2: Instalare cu Chocolatey (Rapid)

Dacă ai Chocolatey instalat:

```powershell
# Instalează Chocolatey dacă nu îl ai
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalează PostgreSQL
choco install postgresql --params '/Password:your_password'
```

## Opțiunea 3: Backup manual din Supabase

Ca alternativă, poți crea backup-uri manual din Supabase Dashboard:

1. Accesează https://supabase.com/dashboard
2. Selectează proiectul tău
3. Mergi la "Settings" → "Database"
4. Fă click pe "Database backups"
5. Descarcă backup-ul și încarcă-l în aplicație

## Verificare finală

După instalare, redeschide VS Code/terminal și încearcă din nou să creezi un backup din aplicație.

Pentru suport tehnic, contactează administratorul sistemului.
