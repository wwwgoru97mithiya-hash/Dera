export const VIBES = {
  homestay: "Homestay",
  beach: "Beach",
  mountains: "Mountains",
  desert: "Desert",
  backwaters: "Backwaters",
  forest: "Forest & treehouses",
  heritage: "Heritage",
  city: "City",
};

export const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

export const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const nightsBetween = (a, b) => {
  if (!a || !b) return 0;
  const n = Math.round((new Date(b) - new Date(a)) / 86400000);
  return n > 0 ? n : 0;
};

export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const STATUS_LABEL = {
  pending: "Waiting for host",
  approved: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};
