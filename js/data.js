// ============================================
// DEPARTMENTS & PROGRAMS DATA
// ============================================

const DEPARTMENTS = {
    "Computer Science": [
        "B.Sc. Computer Science",
        "B.Sc. Software Engineering",
        "B.Sc. Cyber Security",
        "B.Sc. Artificial Intelligence",
        "B.Sc. Data Science"
    ],
    "Information Technology": [
        "B.Sc. Information Technology",
        "B.Sc. Network Administration",
        "B.Sc. Web Development"
    ],
    "Cyber Security": [
        "B.Sc. Cyber Security",
        "B.Sc. Information Security",
        "B.Sc. Digital Forensics"
    ],
    "Biology": [
        "B.Sc. Biology",
        "B.Sc. Microbiology",
        "B.Sc. Biotechnology",
        "B.Sc. Biochemistry"
    ],
    "Mathematics & Computer Science": [
        "B.Sc. Mathematics",
        "B.Sc. Computer Science",
        "B.Sc. Applied Mathematics",
        "B.Sc. Statistics"
    ],
    "Physics": [
        "B.Sc. Physics",
        "B.Sc. Applied Physics",
        "B.Sc. Geophysics",
        "B.Sc. Electronics"
    ],
    "Mass Communication": [
        "B.Sc. Mass Communication",
        "B.Sc. Journalism",
        "B.Sc. Public Relations",
        "B.Sc. Broadcasting"
    ],
    "Political Science": [
        "B.Sc. Political Science",
        "B.Sc. International Relations",
        "B.Sc. Public Administration"
    ],
    "Agricultural Economics": [
        "B.Sc. Agricultural Economics",
        "B.Sc. Agribusiness",
        "B.Sc. Farm Management"
    ],
    "Animal Science": [
        "B.Sc. Animal Science",
        "B.Sc. Livestock Production",
        "B.Sc. Poultry Science"
    ],
    "Crop Science": [
        "B.Sc. Crop Science",
        "B.Sc. Plant Breeding",
        "B.Sc. Soil Science"
    ],
    "Resource Management": [
        "B.Sc. Resource Management",
        "B.Sc. Environmental Management",
        "B.Sc. Natural Resource Management"
    ],
    "Soil and Land Resources": [
        "B.Sc. Soil Science",
        "B.Sc. Land Resources Management",
        "B.Sc. Agroforestry"
    ],
    "Peace and Conflict Studies": [
        "B.Sc. Peace Studies",
        "B.Sc. Conflict Resolution",
        "B.Sc. Human Rights"
    ],
    "International Relations": [
        "B.Sc. International Relations",
        "B.Sc. Diplomacy",
        "B.Sc. Global Studies"
    ],
    "Broadcast Professionalism": [
        "B.Sc. Broadcast Journalism",
        "B.Sc. Media Production",
        "B.Sc. Film Studies"
    ],
    "GST": [
        "GST 101 - Use of English",
        "GST 102 - Communication in English",
        "GST 103 - Logic and Critical Thinking",
        "GST 104 - Nigerian Peoples and Culture",
        "GST 105 - Entrepreneurship"
    ]
};

// You can also add a function to fetch departments from Supabase later
// async function fetchDepartments() {
//     const { data, error } = await supabase.from('departments').select('*');
//     if (error) console.error(error);
//     return data;
// }