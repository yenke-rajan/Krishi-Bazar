const BS_MONTHS_EN = ['Baishakh','Jestha','Asar','Shrawan','Bhadra',
  'Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
const BS_MONTHS_NP = ['बैशाख','जेठ','असार','श्रावण','भाद्र',
  'आश्विन','कार्तिक','मंसिर','पौष','माघ','फाल्गुन','चैत्र'];
const BS_DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const BS_DAYS_NP = ['आइत','सोम','मंगल','बुध','बिही','शुक्र','शनि'];

const BS_YEAR_DATA: Record<number, number[]> = {
  2080: [31,32,31,32,31,30,30,30,29,29,30,30],
  2081: [31,31,32,32,31,30,30,29,30,29,30,30],
  2082: [31,31,32,32,31,30,30,29,30,29,30,30],
  2083: [31,32,31,32,31,30,30,30,29,29,30,31],
  2084: [30,32,31,32,31,30,30,30,29,30,29,31],
  2085: [31,31,32,31,31,31,30,29,30,29,30,30],
  2086: [31,31,32,32,31,30,30,29,30,29,30,30],
};

const REF_AD = new Date(2024, 3, 13);
const REF_BS = { year: 2081, month: 0, day: 1 };

export interface BSDate {
  adDate: Date;
  year: number;
  month: number;
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  dayNameEn: string;
  dayNameNp: string;
  dateStringBS: string;
}

function adToBS(adDate: Date): Omit<BSDate, 'adDate' | 'dayNameEn' | 'dayNameNp'> {
  const msPerDay = 86400000;
  const daysDiff = Math.round(
    (new Date(adDate.getFullYear(), adDate.getMonth(), adDate.getDate()).getTime()
     - REF_AD.getTime()) / msPerDay
  );
  let { year, month, day } = { ...REF_BS };
  let rem = daysDiff;

  if (rem >= 0) {
    while (rem > 0) {
      const daysInMonth = BS_YEAR_DATA[year]?.[month] ?? 30;
      const left = daysInMonth - day + 1;
      if (rem < left) { day += rem; rem = 0; }
      else { rem -= left; day = 1; month++; if (month >= 12) { month = 0; year++; } }
    }
  } else {
    rem = Math.abs(rem);
    while (rem > 0) {
      if (rem < day) { day -= rem; rem = 0; }
      else { rem -= day; month--; if (month < 0) { month = 11; year--; }
             day = BS_YEAR_DATA[year]?.[month] ?? 30; }
    }
  }
  return {
    year, month, day,
    monthNameEn: BS_MONTHS_EN[month],
    monthNameNp: BS_MONTHS_NP[month],
    dateStringBS: `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
  };
}

export function get7DayBSWindow(): BSDate[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const adDate = new Date(today);
    adDate.setDate(today.getDate() + i);
    const bs = adToBS(adDate);
    return {
      adDate,
      ...bs,
      dayNameEn: BS_DAYS_EN[adDate.getDay()],
      dayNameNp: BS_DAYS_NP[adDate.getDay()],
    };
  });
}

export function formatBSDate(dateStr: string, lang: 'en' | 'np'): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const mIdx = month - 1;
  const mName = lang === 'np' ? BS_MONTHS_NP[mIdx] : BS_MONTHS_EN[mIdx];
  return lang === 'np'
    ? `${mName} ${day}, ${year}`
    : `${mName} ${day}, ${year} BS`;
}
