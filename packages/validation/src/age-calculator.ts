export const AGE_CALCULATOR_SLUG = 'age';

export type AgeCalculatorOutputs = {
  ageYears: number;
  ageMonths: number;
  ageDays: number;
  totalDays: number;
  nextBirthdayDays: number;
};

function parseDateOnly(value: unknown, label: string): Date {
  const raw = String(value ?? '').trim();
  if (!raw) throw new Error(`${label} is required`);
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label.toLowerCase()}`);
  return date;
}

export function computeAgeFromDates(dateOfBirth: unknown, endDate: unknown): AgeCalculatorOutputs {
  const birth = parseDateOnly(dateOfBirth, 'Date of birth');
  const end = parseDateOnly(endDate ?? new Date().toISOString().slice(0, 10), 'End date');

  if (end < birth) {
    throw new Error('End date must be on or after date of birth');
  }

  let years = end.getFullYear() - birth.getFullYear();
  let months = end.getMonth() - birth.getMonth();
  let days = end.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor((end.getTime() - birth.getTime()) / msPerDay);

  let nextBirthday = new Date(end.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= end) {
    nextBirthday = new Date(end.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const nextBirthdayDays = Math.ceil((nextBirthday.getTime() - end.getTime()) / msPerDay);

  return {
    ageYears: years,
    ageMonths: years * 12 + months,
    ageDays: days,
    totalDays,
    nextBirthdayDays,
  };
}
