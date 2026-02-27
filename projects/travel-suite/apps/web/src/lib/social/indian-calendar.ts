export interface IndianFestival {
    id: string;
    name: string;
    nameHindi: string;
    date: string; // ISO yyyy-mm-dd
    surfaceBeforeDays: number;
    templateCategory: string;
    tags: string[];
}

// Data for 2026-2027
export const indianCalendarDesc: IndianFestival[] = [
    { id: 'holi_2026', name: 'Holi', nameHindi: 'होली', date: '2026-03-03', surfaceBeforeDays: 21, templateCategory: 'Festival', tags: ['holi', 'festival', 'spring'] },
    { id: 'independence_day_2026', name: 'Independence Day', nameHindi: 'स्वतंत्रता दिवस', date: '2026-08-15', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['independence', 'india', 'patriotic'] },
    { id: 'raksha_bandhan_2026', name: 'Raksha Bandhan', nameHindi: 'रक्षा बंधन', date: '2026-08-28', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['rakhi', 'siblings'] },
    { id: 'ganesh_chaturthi_2026', name: 'Ganesh Chaturthi', nameHindi: 'गणेश चतुर्थी', date: '2026-09-14', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['ganpati', 'bappa'] },
    { id: 'navratri_2026', name: 'Navratri', nameHindi: 'नवरात्रि', date: '2026-10-10', surfaceBeforeDays: 21, templateCategory: 'Festival', tags: ['garba', 'dandiya', 'devi'] },
    { id: 'dussehra_2026', name: 'Dussehra', nameHindi: 'दशहरा', date: '2026-10-19', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['vijayadashami'] },
    { id: 'diwali_2026', name: 'Diwali', nameHindi: 'दिवाली', date: '2026-11-08', surfaceBeforeDays: 30, templateCategory: 'Festival', tags: ['deepavali', 'lights', 'festive'] },
    { id: 'christmas_2026', name: 'Christmas', nameHindi: 'क्रिसमस', date: '2026-12-25', surfaceBeforeDays: 30, templateCategory: 'Festival', tags: ['xmas', 'winter', 'holiday'] },
    { id: 'republic_day_2027', name: 'Republic Day', nameHindi: 'गणतंत्र दिवस', date: '2027-01-26', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['republic', 'india', 'patriotic'] },
    { id: 'mahashivratri_2027', name: 'Maha Shivaratri', nameHindi: 'महा शिवरात्रि', date: '2027-03-06', surfaceBeforeDays: 14, templateCategory: 'Festival', tags: ['shiva', 'bholenath'] }
];

export function getUpcomingFestivals(): IndianFestival[] {
    const now = new Date();

    return indianCalendarDesc.filter(fest => {
        const festDate = new Date(fest.date);
        // Include all day of festival by setting time to 23:59:59
        festDate.setHours(23, 59, 59, 999);

        const surfaceStart = new Date(festDate);
        surfaceStart.setDate(festDate.getDate() - fest.surfaceBeforeDays);
        surfaceStart.setHours(0, 0, 0, 0);

        return now.getTime() >= surfaceStart.getTime() && now.getTime() <= festDate.getTime();
    });
}
