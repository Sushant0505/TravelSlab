/**
 * Indian departure cities for the trip planner's city autocomplete.
 * Not exhaustive — free-typed values are still accepted.
 */
export const CITIES: string[] = [
  "Agartala", "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad (Prayagraj)",
  "Amritsar", "Aurangabad", "Bareilly", "Belagavi", "Bengaluru", "Bhopal",
  "Bhubaneswar", "Bikaner", "Bokaro", "Chandigarh", "Chennai", "Coimbatore",
  "Cuttack", "Dehradun", "Delhi", "Dhanbad", "Dibrugarh", "Dimapur", "Durgapur",
  "Faridabad", "Gandhinagar", "Gangtok", "Gaya", "Ghaziabad", "Goa (Panaji)",
  "Gorakhpur", "Gurugram", "Guwahati", "Gwalior", "Haridwar", "Hubballi",
  "Hyderabad", "Imphal", "Indore", "Itanagar", "Jabalpur", "Jaipur", "Jaisalmer",
  "Jalandhar", "Jammu", "Jamshedpur", "Jodhpur", "Kannur", "Kanpur", "Kochi",
  "Kolhapur", "Kolkata", "Kota", "Kozhikode", "Leh", "Lucknow", "Ludhiana",
  "Madurai", "Mangaluru", "Meerut", "Mumbai", "Muzaffarpur", "Mysuru", "Nagpur",
  "Nashik", "Navi Mumbai", "Noida", "Patna", "Port Blair", "Puducherry", "Pune",
  "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Rishikesh", "Rourkela", "Salem",
  "Shillong", "Shimla", "Siliguri", "Srinagar", "Surat", "Thane",
  "Thiruvananthapuram", "Tiruchirappalli", "Tirupati", "Udaipur", "Ujjain",
  "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam", "Warangal",
];

/** Best matches for a query: prefix matches first, then substring matches. */
export function filterCities(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const city of CITIES) {
    const lc = city.toLowerCase();
    if (lc.startsWith(q)) starts.push(city);
    else if (lc.includes(q)) contains.push(city);
  }
  // Don't show a lone exact match (user has already typed the full city).
  const out = [...starts, ...contains];
  if (out.length === 1 && out[0].toLowerCase() === q) return [];
  return out.slice(0, limit);
}
