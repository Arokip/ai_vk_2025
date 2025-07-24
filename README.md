# 🗳️ Volební kalkulačka 2025 - Parlamentní volby ČR

Objektivní anketa pro české parlamentní volby konané **3. - 4. října 2025**. Aplikace vám pomůže zjistit, která politická strana nebo uskupení nejlépe odpovídá vašim politickým názorům.

## 📋 Popis

Tato volební kalkulačka je založena na skutečných postojích a programech 8 největších politických uskupení kandidujících do Poslanecké sněmovny ČR:

1. **ANO 2011** (30-32%) - Populistické hnutí (lídr: Andrej Babiš)
2. **SPOLU** (20-21%) - Liberálně-konzervativní koalice ODS, TOP 09, KDU-ČSL (lídr: Petr Fiala)
3. **SPD + Trikolora + PRO + Svobodní** (12-14%) - Národně-konzervativní uskupení (lídr: Tomio Okamura)
4. **Starostové a nezávislí (STAN)** (9-11%) - Středové hnutí (lídr: Vít Rakušan)
5. **Česká pirátská strana** (5-7%) - Liberální strana (lídr: Zdeněk Hřib)
6. **Stačilo!** (5-7%) - Levicová koalice KSČM + SOCDEM + ČSNS + SD-SN (lídr: Kateřina Konečná)
7. **Motoristé sobě** (3-5%) - Populistická strana (lídr: Petr Macinka)
8. **Přísaha** (2-3%) - Protikorupční hnutí (lídr: Robert Šlachta)

## 🎯 Jak funguje anketa

### Proces vyplňování
1. **32 otázek** pokrývajících klíčová politická témata pro volby 2025
2. **Dvě odpovědi na každou otázku:**
   - **Míra souhlasu** s tvrzením (0-100%)
   - **Důležitost tématu** pro vás (0-100%)

### Témata ankety
- 🇪🇺 **Evropská unie a euro** - přijetí eura, evropské kvóty, Green Deal
- 🛡️ **Bezpečnost a obrana** - NATO, výdaje na obranu, podpora Ukrajiny
- 💰 **Ekonomika a daně** - daně korporacím, minimální mzda, EET, bankovní daň
- 🌍 **Klimatická změna** - uhlí vs. obnovitelné zdroje, jaderná energie
- 👥 **Sociální politika** - důchody, rodičovský příspěvek, manželství pro všechny
- 🏥 **Zdravotnictví** - veřejné vs. soukromé zdravotnictví
- 🎓 **Vzdělání** - bezplatné vysoké školy, kratší pracovní týden
- 💻 **Digitalizace a technologie** - AI regulace, elektronické vládnutí
- ⚖️ **Spravedlnost** - alternativní tresty, exekutoři, domácí násilí
- 🌿 **Drogy** - legalizace konopí pro osobní potřebu
- 🔍 **Transparentnost** - majetek politiků, whistlebloweři, promlčení korupce
- 🏛️ **Demokracie** - referenda o důležitých rozhodnutích
- 🏠 **Bydlení** - obecní byty pro mladé rodiny
- 🌐 **Zahraniční politika** - vztahy s Ruskem, podpora Ukrajiny

### Výpočet výsledků
- **Algoritmus** porovnává vaše odpovědi s oficiálními pozicemi stran
- **Váha otázky** se zvyšuje podle důležitosti tématu pro vás
- **Finální skóre** ukazuje procentní shodu s každou stranou
- **Seřazení** od nejvyšší po nejnižší shodu

## 🚀 Spuštění aplikace

### Varianta 1: Lokální server (doporučeno)
```bash
# Přejděte do složky s aplikací
cd volby2025-kalkulacka

# Spusťte lokální HTTP server
python3 -m http.server 8000

# Otevřete prohlížeč na adrese:
# http://localhost:8000
```

### Varianta 2: Přímé otevření HTML
Můžete také přímo otevřít soubor `index.html` ve webovém prohlížeči, ale doporučujeme použít lokální server kvůli správnému načítání JSON dat.

## 📊 Google Sheets Tracking (NOVÁ FUNKCIONALITA)

Aplikace nyní automaticky zaznamenává **jeden záznam na uživatele**:
- ✅ **Vstup uživatele** na stránku s anketou
- ✅ **Začátek ankety** - kdy uživatel klikne "Začít anketu"  
- ✅ **Dokončení ankety** - kompletní výsledky uživatele
- ✅ **Nový záznam** pouze při kliknutí na "Zkusit znovu"

### Struktura dat v Google Sheets (jeden řádek na uživatele)
- **User ID**: Unikátní identifikátor pro každého uživatele
- **First Visit**: Kdy uživatel poprvé navštívil stránku
- **Survey Started**: Kdy začal anketu
- **Survey Completed**: Kdy dokončil anketu
- **Final Results**: Kompletní výsledky ankety
- **Top Party**: Nejlépe vyhovující strana
- **Session Duration**: Doba trvání ankety (v sekundách)
- **Completion Rate**: Míra dokončení ankety (%)

### Nastavení trackingu
Pro aktivaci sledování viz [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

### Ochrana soukromí
- Žádné osobní údaje se nesbírají
- User ID se generuje náhodně
- Data se ukládají pouze do vašeho Google Drive
- **Jeden záznam na uživatele** - data se aktualizují v témže řádku
- **Nový záznam jen při kliknutí na "Zkusit znovu"**
- User ID se resetuje po 4 hodinách nebo novém dni

## 📁 Struktura souborů

```
volby2025-kalkulacka/
├── index.html                 # Hlavní HTML soubor s rozhraním
├── app.js                    # JavaScript logika aplikace + tracking
├── volby2025_dataset.json    # Dataset s otázkami a pozicemi stran
├── google-apps-script.js     # Kód pro Google Apps Script
├── SETUP_INSTRUCTIONS.md     # Návod na nastavení Google Sheets
└── README.md                 # Tento soubor s instrukcemi
```

## 🔧 Technické detaily

### Soubory
- **index.html**: Responsivní webové rozhraní s moderním designem
- **app.js**: Kompletní logika pro načítání dat, navigaci a výpočty
- **volby2025_dataset.json**: 32 otázek s pozicemi všech 8 stran

### Funkce
- ✅ Postupné procházení otázek s progress barem
- ✅ Uložení průběhu do localStorage (návrat po obnovení stránky)
- ✅ Responsivní design pro mobily a tablety
- ✅ Detailní výsledky se seznamem stran podle shody
- ✅ Možnost exportu výsledků (pro debugging)
- ✅ Restart ankety kdykoliv
- ✅ **Google Sheets integrace** - automatické logování uživatelských interakcí

### Kompatibilita
- Moderní webové prohlížeče (Chrome, Firefox, Safari, Edge)
- Mobilní zařízení (responsive design)
- Nevyžaduje internetové připojení po načtení

## 🎨 Ukázka rozhraní

### Úvodní obrazovka
- Přehledný popis ankety a instrukcí
- Tlačítko pro spuštění

### Otázky
- Přehledné zobrazení kategorie a textu otázky
- Dva slidery pro odpovědi (souhlas + důležitost)
- Navigace vpřed/vzad mezi otázkami
- Progress bar ukazující postup

### Výsledky
- Seřazený seznam stran podle shody
- Procentní skóre pro každou stranu
- Informace o lídrech a popis stran
- Tlačítko pro restart ankety

## 📊 Metodika a objektivita

### Zdroje dat
- **Volební programy** politických stran pro volby 2025
- **Veřejná vyjádření** lídrů a představitelů stran
- **Hlasování** ve sněmovně a postojové dokumenty
- **Současné průzkumy** volebních preferencí (MEDIAN, STEM, NMS)
- **Aktuální legislativa** - trestní reforma, legalizace konopí, Green Deal

### Princip objektivity
- Všechny pozice jsou založené na **skutečných postojích** stran
- **Vyvážené otázky** pokrývající celé politické spektrum
- **Transparentní algoritmus** výpočtu bez skrytých preferencí
- **Stejná váha** pro všechny strany v datasetu

### Aktualizace 2025
- **32 otázek** místo původních 25 pro lepší přesnost
- **Aktuální témata**: podpora Ukrajiny, legalizace konopí, trestní reforma
- **Přísaha nahradila SOCDEM** (SOCDEM je součástí koalice Stačilo!)
- **SPD kandiduje s podporou** Trikolory, PRO a Svobodných
- **Nová témata**: Green Deal, manželství pro všechny, AI regulace, whistleblowing

### Omezení
- Výsledky jsou **pouze orientační** a nenahrazují studium programů
- Strany mohou měnit své postoje v průběhu kampaně
- Anketa nezohledňuje **regionální kandidáty** a preference
- Doporučujeme prostudovat si kompletní volební programy

## ⚠️ Důležité upozornění

**Tato anketa je nezávislý projekt** a není spojena s žádnou politickou stranou nebo organizací. Jejím cílem je pomoci voličům lépe porozumět rozdílům mezi stranami na základě faktických informací.

**Výsledky jsou pouze orientační** a neměly by být jediným faktorem při rozhodování o volbě. Doporučujeme:
- Prostudovat si kompletní volební programy stran
- Sledovat předvolební debaty a diskuse
- Zvážit také lokální kandidáty ve vašem kraji
- Informovat se o historii a výsledcích stran

## 📞 Podpora a feedback

Pokud najdete chybu v datech nebo máte návrh na vylepšení, můžete:
- Otevřít issue v repozitáři
- Kontaktovat autory projektu
- Navrhnout změny v datasetu

## 📜 Licence

Tento projekt je vyvíjen jako open-source a je volně dostupný pro nekomerční použití. Data o postojích stran vycházejí z veřejně dostupných zdrojů.

---

**Volby do Poslanecké sněmovny ČR se konají 3. - 4. října 2025**  
**Nezapomeňte jít volit! 🗳️** 