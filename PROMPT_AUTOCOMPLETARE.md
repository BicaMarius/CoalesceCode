# 🤖 PROMPT — AUTO-COMPLETARE BLUEPRINT 02 (Push Doc)

Copiază tot blocul de mai jos și trimite-l unui AI împreună cu informațiile din secțiunea "CE TREBUIE SĂ ATAȘEZI".

---

## PROMPT SISTEM (system prompt / instrucțiuni)

```
Ești un asistent specializat în documentare tehnică pentru echipe de dezvoltare software.
Rolul tău este să completezi template-ul BLUEPRINT_02_PUSH_DOC.md pe baza informațiilor furnizate.

REGULI STRICTE:
1. Completează NUMAI câmpurile pe care le poți deduce cu certitudine din informațiile primite.
2. Lasă câmpurile pe care NU le poți deduce marcate exact cu: `⚠️ de completat manual`
3. NU inventa niciodată: date calendaristice, ore lucrate, versiuni, nume de persoane.
4. NU inventa buguri sau probleme care nu sunt menționate explicit.
5. Fii concis în descrieri — maxim 1-2 rânduri per câmp.
6. Păstrează EXACT structura și formatarea Markdown a template-ului original.
7. Completează blocul METADATA_JSON de la final cu valorile extrase.
8. Dacă un câmp nu este aplicabil, scrie: `—`

PENTRU SECȚIUNEA "MODIFICĂRI":
- Analizează fișierele adăugate/modificate/șterse din diff sau lista furnizată.
- Pentru fiecare fișier, deduce "De ce" din contextul modificărilor.
- Grupează fișierele logice împreună (ex: toate fișierele unui component = 1 rând).

PENTRU DIFICULTATE TASK:
- Evaluează pe scala 1-10 bazat pe: complexitate tehnică, număr de fișiere afectate, risc de breaking changes, necesitatea de research.
- 1-3 = simplu (styling, text, config), 4-6 = mediu (funcție nouă, refactor), 7-9 = complex (arhitectură, integrare nouă), 10 = extrem (securitate critică, migrare DB majoră).

PENTRU INSTRUCȚIUNI DE RULARE:
- Incluide NUMAI pașii noi sau modificați față de setup-ul standard.
- Dacă nu s-a schimbat nimic în setup, scrie: "Nicio schimbare față de versiunea anterioară."

OUTPUT: Returnează DOAR conținutul fișierului Markdown completat, fără explicații înainte sau după.
```

---

## MESAJUL TĂU (user message)

```
Completează template-ul BLUEPRINT_02_PUSH_DOC.md pe baza informațiilor de mai jos.

=== TEMPLATE ===
[LIPEȘTE AICI CONȚINUTUL INTEGRAL AL FIȘIERULUI BLUEPRINT_02_PUSH_DOC.md]

=== INFORMAȚII DISPONIBILE ===

**REPO:** [ex: my-app-frontend]
**BRANCH:** [ex: feature/auth-system]
**AUTOR:** [ex: Andrei]
**TASK:** [ex: #14 — Implementare sistem de autentificare cu JWT]

**VERSIUNE ANTERIOARĂ:** [ex: 0.3.1]
**VERSIUNE NOUĂ:** [ex: 0.4.0]

**DESCRIERE SCURTĂ A CE AM FĂCUT:**
[ex: Am adăugat autentificare cu JWT, refresh tokens și middleware de protecție a rutelor]

**FIȘIERE MODIFICATE / GIT DIFF:**
[Lipește output-ul comenzii: git diff --stat HEAD~1
 sau listează manual fișierele + ce ai făcut în fiecare]

**TIMP LUCRAT (dacă știi):** [ex: ~4h sau lasă gol]
**PULL TIME:** [ex: 14:30 sau lasă gol]
**PUSH TIME:** [ex: 18:45 sau lasă gol]

**BUGURI REZOLVATE (dacă există):**
[ex: Fix crash la logout când token-ul era expirat]

**BUGURI CUNOSCUTE RĂMASE (dacă există):**
[ex: Refresh token nu funcționează pe Safari iOS]

**BREAKING CHANGES (dacă există):**
[ex: Endpoint /api/user acum necesită header Authorization: Bearer <token>]

**NOTE EXTRA PENTRU ECHIPĂ (opțional):**
[ex: Trebuie să adăugați JWT_SECRET în .env înainte de a rula]
```

---

## VARIANTE RAPIDE

### Variantă minimală (când ești grăbit)
```
Completează BLUEPRINT_02_PUSH_DOC.md pentru următorul push:

TEMPLATE: [lipește template-ul]

TASK: [descriere în 1-2 rânduri]
FIȘIERE: [git diff --stat sau listă manuală]
AUTOR: [numele tău]
REPO: [repo-ul]

Marcheaza cu ⚠️ tot ce nu poți deduce.
```

### Variantă cu git diff complet
```
Completează BLUEPRINT_02_PUSH_DOC.md.

TEMPLATE: [lipește template-ul]

GIT DIFF COMPLET:
[lipește output-ul comenzii: git diff HEAD~1]

CONTEXT ADIȚIONAL: [orice știi tu extra]
```

---

## COMENZI GIT UTILE ÎNAINTE DE PUSH

```bash
# Ce fișiere s-au schimbat (scurt)
git diff --stat HEAD~1

# Diff complet (pentru AI)
git diff HEAD~1

# Ce commit-uri am făcut de la ultimul push
git log origin/main..HEAD --oneline

# Toate fișierele modificate față de main
git diff --name-status main

# Cât timp a trecut de la primul commit din branch
git log --reverse --format="%ar" | head -1
```

---

## SFATURI DE UTILIZARE

**Pentru cel mai bun rezultat:**
- Dă-i AI-ului `git diff --stat` minim — e suficient pentru 80% din câmpuri
- Menționează explicit orice breaking change — AI-ul nu poate detecta impactul downstream
- Dacă ai lucrat pe mai multe zile, spune-i explicit orele totale
- Versiunile (v0.x.x) trebuie date manual — AI-ul nu știe versiunea curentă a proiectului

**Câmpuri pe care AI-ul le completează bine automat:**
- Lista fișierelor adăugate/modificate/șterse ✅
- Deducerea "de ce" din context ✅
- Dificultatea task-ului ✅
- Instrucțiuni de rulare dacă ai menționat schimbări ✅
- Blocul METADATA_JSON ✅

**Câmpuri pe care TREBUIE să le dai tu:**
- Data și ora pull/push ⚠️
- Versiunea anterioară și cea nouă ⚠️
- Timp efectiv lucrat (dacă nu l-ai calculat) ⚠️
- Breaking changes cu impact extern ⚠️
- Linkuri și referințe specifice proiectului vostru ⚠️
