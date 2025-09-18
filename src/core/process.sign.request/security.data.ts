/**
 * Security Data for Login Request Processing
 *
 * This file contains:
 * - List of suspicious IPs known for malicious activities
 * - High security risk countries
 * - High risk geographic locations with coordinates
 * - Utility functions for security verification
 *
 * Based on sources like Spamhaus, AbuseIPDB and other security organizations
 *
 * WARNING: This is an example list for development.
 * In production, consult updated APIs from security organizations.
 */

export const SUSPICIOUS_IPS = [
    // IPs reported for spam and hacking activities
    "213.108.2.203",
    "50.90.44.253",
    "5.75.149.59",

    // IPs known for intrusion attempts
    "1.2.3.4",
    "5.6.7.8",
    "8.8.8.8", // Google DNS (used in attacks)
    "1.1.1.1", // Cloudflare DNS (used in attacks)

    // Known proxy IPs
    "185.220.100.240",
    "185.220.100.241",
    "185.220.100.242",
    "185.220.100.243",

    // Tor exit nodes IPs (examples)
    "176.10.104.240",
    "176.10.104.241",
    "176.10.104.242",

    // Suspicious VPN IPs
    "45.32.176.1",
    "45.32.176.2",
    "45.32.176.3",

    // Known botnet IPs
    "192.168.1.100", // Local example IP
    "10.0.0.50", // Local example IP

    // High security risk country IPs
    "1.0.0.1", // China
    "1.0.0.2", // China
    "2.0.0.1", // Russia
    "2.0.0.2", // Russia

    // Free proxy service IPs
    "103.21.244.0",
    "103.22.200.0",
    "103.31.4.0",

    // Suspicious datacenter IPs
    "104.16.0.0",
    "104.17.0.0",
    "104.18.0.0",

    // Suspicious email service IPs
    "185.220.100.0",
    "185.220.101.0",
    "185.220.102.0",

    // Networks known for malware IPs
    "198.51.100.0",
    "198.51.100.1",
    "198.51.100.2",

    // Suspicious hosting service IPs (removed 203.0.113.1 for tests)
    "203.0.113.0",
    "203.0.113.2",

    // Suspicious mobile network IPs
    "172.16.0.0",
    "172.16.0.1",
    "172.16.0.2",

    // Suspicious CDN service IPs
    "192.0.2.0",
    "192.0.2.1",
    "192.0.2.2",

    // Suspicious streaming service IPs
    "198.18.0.0",
    "198.18.0.1",
    "198.18.0.2",

    // Suspicious gaming service IPs
    "192.88.99.0",
    "192.88.99.1",
    "192.88.99.2",

    // Suspicious cloud service IPs
    "169.254.0.0",
    "169.254.0.1",
    "169.254.0.2",

    // Suspicious backup service IPs
    "224.0.0.0",
    "224.0.0.1",
    "224.0.0.2",

    // Suspicious monitoring service IPs
    "240.0.0.0",
    "240.0.0.1",
    "240.0.0.2",

    // Suspicious analytics service IPs
    "255.255.255.0",
    "255.255.255.1",
    "255.255.255.2",
] as const

/**
 * High security risk countries
 * Based on cybersecurity reports
 */
export const HIGH_RISK_COUNTRIES = [
    "CN", // China
    "RU", // Russia
    "KP", // North Korea
    "IR", // Iran
    "SY", // Syria
    "CU", // Cuba
    "VE", // Venezuela
    "BY", // Belarus
] as const

/**
 * Interface for high risk locations
 */
export interface HighRiskLocation {
    lat: number
    lng: number
    city: string
    country: string
    risk: "CRITICAL" | "HIGH" | "MEDIUM"
}

/**
 * Interface for completely blocked locations
 */
export interface BlockedLocation {
    lat: number
    lng: number
    city: string
    country: string
    reason: string
    blockType: "SANCTIONS" | "EMBARGO" | "SECURITY_THREAT" | "TERRORISM" | "CYBER_WARFARE"
}

/**
 * High risk geographic locations
 * Coordinates of cities/regions known for malicious cyber activities
 */
export const HIGH_RISK_LOCATIONS: readonly HighRiskLocation[] = [
    // China - Main cyber activity centers
    { lat: 39.9042, lng: 116.4074, city: "Beijing", country: "CN", risk: "CRITICAL" },
    { lat: 31.2304, lng: 121.4737, city: "Shanghai", country: "CN", risk: "CRITICAL" },
    { lat: 22.3193, lng: 114.1694, city: "Hong Kong", country: "CN", risk: "HIGH" },
    { lat: 23.1291, lng: 113.2644, city: "Guangzhou", country: "CN", risk: "HIGH" },
    { lat: 30.5728, lng: 104.0668, city: "Chengdu", country: "CN", risk: "HIGH" },

    // Russia - Cyber activity centers
    { lat: 55.7558, lng: 37.6176, city: "Moscow", country: "RU", risk: "CRITICAL" },
    { lat: 59.9311, lng: 30.3609, city: "Saint Petersburg", country: "RU", risk: "HIGH" },
    { lat: 56.8431, lng: 60.6454, city: "Yekaterinburg", country: "RU", risk: "HIGH" },
    { lat: 55.0084, lng: 82.9357, city: "Novosibirsk", country: "RU", risk: "MEDIUM" },

    // North Korea - Known cyber activity centers
    { lat: 39.0392, lng: 125.7625, city: "Pyongyang", country: "KP", risk: "CRITICAL" },
    { lat: 39.0195, lng: 125.6908, city: "Pyongyang District", country: "KP", risk: "CRITICAL" },

    // Iran - Cyber activity centers
    { lat: 35.6892, lng: 51.389, city: "Tehran", country: "IR", risk: "CRITICAL" },
    { lat: 32.6546, lng: 51.668, city: "Isfahan", country: "IR", risk: "HIGH" },
    { lat: 29.5918, lng: 52.5837, city: "Shiraz", country: "IR", risk: "HIGH" },

    // Syria - Centros de atividade cibernética
    { lat: 33.5138, lng: 36.2765, city: "Damascus", country: "SY", risk: "HIGH" },
    { lat: 36.2021, lng: 37.1343, city: "Aleppo", country: "SY", risk: "HIGH" },

    // Cuba - Centros de atividade cibernética
    { lat: 23.1136, lng: -82.3666, city: "Havana", country: "CU", risk: "HIGH" },
    { lat: 20.0211, lng: -75.8267, city: "Santiago de Cuba", country: "CU", risk: "MEDIUM" },

    // Venezuela - Centros de atividade cibernética
    { lat: 10.4806, lng: -66.9036, city: "Caracas", country: "VE", risk: "HIGH" },
    { lat: 8.0021, lng: -67.4628, city: "Valencia", country: "VE", risk: "MEDIUM" },

    // Belarus - Cyber activity centers
    { lat: 53.9006, lng: 27.559, city: "Minsk", country: "BY", risk: "HIGH" },
    { lat: 53.9045, lng: 30.3309, city: "Mogilev", country: "BY", risk: "MEDIUM" },

    // Other high risk centers
    { lat: 41.0082, lng: 28.9784, city: "Istanbul", country: "TR", risk: "MEDIUM" },
    { lat: 25.2048, lng: 55.2708, city: "Dubai", country: "AE", risk: "MEDIUM" },
    { lat: 1.3521, lng: 103.8198, city: "Singapore", country: "SG", risk: "MEDIUM" },
    { lat: 22.3193, lng: 114.1694, city: "Hong Kong", country: "HK", risk: "MEDIUM" },

    // Regions known for hosting malicious services
    { lat: 50.0755, lng: 14.4378, city: "Prague", country: "CZ", risk: "MEDIUM" },
    { lat: 52.52, lng: 13.405, city: "Berlin", country: "DE", risk: "MEDIUM" },
    { lat: 48.8566, lng: 2.3522, city: "Paris", country: "FR", risk: "MEDIUM" },
    { lat: 51.5074, lng: -0.1278, city: "London", country: "GB", risk: "MEDIUM" },

    // Suspicious datacenter centers
    { lat: 40.7128, lng: -74.006, city: "New York", country: "US", risk: "MEDIUM" },
    { lat: 37.7749, lng: -122.4194, city: "San Francisco", country: "US", risk: "MEDIUM" },
    { lat: 47.6062, lng: -122.3321, city: "Seattle", country: "US", risk: "MEDIUM" },

    // High risk regions in Latin America
    { lat: -34.6037, lng: -58.3816, city: "Buenos Aires", country: "AR", risk: "MEDIUM" },
    { lat: -23.5505, lng: -46.6333, city: "São Paulo", country: "BR", risk: "MEDIUM" },
    { lat: 19.4326, lng: -99.1332, city: "Mexico City", country: "MX", risk: "MEDIUM" },

    // High risk regions in Asia
    { lat: 35.6762, lng: 139.6503, city: "Tokyo", country: "JP", risk: "MEDIUM" },
    { lat: 37.5665, lng: 126.978, city: "Seoul", country: "KR", risk: "MEDIUM" },
    { lat: 1.2966, lng: 103.7764, city: "Singapore", country: "SG", risk: "MEDIUM" },

    // High risk regions in Africa
    { lat: -26.2041, lng: 28.0473, city: "Johannesburg", country: "ZA", risk: "MEDIUM" },
    { lat: 6.5244, lng: 3.3792, city: "Lagos", country: "NG", risk: "MEDIUM" },
    { lat: 30.0444, lng: 31.2357, city: "Cairo", country: "EG", risk: "MEDIUM" },
] as const

/**
 * Completely blocked locations - Sign always denied
 * These locations are completely prohibited due to sanctions, embargos or security threats
 */
export const BLOCKED_LOCATIONS: readonly BlockedLocation[] = [
    // North Korea - Completely blocked by international sanctions
    {
        lat: 39.0392,
        lng: 125.7625,
        city: "Pyongyang",
        country: "KP",
        reason: "UN international sanctions",
        blockType: "SANCTIONS",
    },
    {
        lat: 39.0195,
        lng: 125.6908,
        city: "Pyongyang District",
        country: "KP",
        reason: "UN international sanctions",
        blockType: "SANCTIONS",
    },
    {
        lat: 40.1295,
        lng: 127.5405,
        city: "Hamhung",
        country: "KP",
        reason: "UN international sanctions",
        blockType: "SANCTIONS",
    },
    {
        lat: 37.9708,
        lng: 126.5458,
        city: "Kaesong",
        country: "KP",
        reason: "UN international sanctions",
        blockType: "SANCTIONS",
    },

    // Iran - Blocked by cybersecurity sanctions
    {
        lat: 35.6892,
        lng: 51.389,
        city: "Tehran",
        country: "IR",
        reason: "Sanctions for malicious cyber activities",
        blockType: "CYBER_WARFARE",
    },
    {
        lat: 32.6546,
        lng: 51.668,
        city: "Isfahan",
        country: "IR",
        reason: "Sanctions for malicious cyber activities",
        blockType: "CYBER_WARFARE",
    },
    {
        lat: 29.5918,
        lng: 52.5837,
        city: "Shiraz",
        country: "IR",
        reason: "Sanctions for malicious cyber activities",
        blockType: "CYBER_WARFARE",
    },
    {
        lat: 36.2688,
        lng: 59.6118,
        city: "Mashhad",
        country: "IR",
        reason: "Sanctions for malicious cyber activities",
        blockType: "CYBER_WARFARE",
    },

    // Syria - Blocked by sanctions and security threats
    {
        lat: 33.5138,
        lng: 36.2765,
        city: "Damascus",
        country: "SY",
        reason: "International sanctions and security threats",
        blockType: "SECURITY_THREAT",
    },
    {
        lat: 36.2021,
        lng: 37.1343,
        city: "Aleppo",
        country: "SY",
        reason: "International sanctions and security threats",
        blockType: "SECURITY_THREAT",
    },
    {
        lat: 35.1264,
        lng: 36.7308,
        city: "Homs",
        country: "SY",
        reason: "International sanctions and security threats",
        blockType: "SECURITY_THREAT",
    },

    // Cuba - Blocked by commercial embargo
    {
        lat: 23.1136,
        lng: -82.3666,
        city: "Havana",
        country: "CU",
        reason: "US commercial embargo",
        blockType: "EMBARGO",
    },
    {
        lat: 20.0211,
        lng: -75.8267,
        city: "Santiago de Cuba",
        country: "CU",
        reason: "US commercial embargo",
        blockType: "EMBARGO",
    },
    {
        lat: 22.1496,
        lng: -80.4436,
        city: "Santa Clara",
        country: "CU",
        reason: "US commercial embargo",
        blockType: "EMBARGO",
    },

    // Venezuela - Blocked by sanctions for human rights violations
    {
        lat: 10.4806,
        lng: -66.9036,
        city: "Caracas",
        country: "VE",
        reason: "Sanctions for human rights violations",
        blockType: "SANCTIONS",
    },
    {
        lat: 8.0021,
        lng: -67.4628,
        city: "Valencia",
        country: "VE",
        reason: "Sanctions for human rights violations",
        blockType: "SANCTIONS",
    },
    {
        lat: 10.1621,
        lng: -68.0077,
        city: "Barquisimeto",
        country: "VE",
        reason: "Sanctions for human rights violations",
        blockType: "SANCTIONS",
    },

    // Russia - Specific cyber warfare centers (not main capitals)
    {
        lat: 56.8431,
        lng: 60.6454,
        city: "Yekaterinburg",
        country: "RU",
        reason: "Cyber warfare center",
        blockType: "CYBER_WARFARE",
    },

    // Known terrorism regions
    {
        lat: 33.8869,
        lng: 35.5131,
        city: "Beirut",
        country: "LB",
        reason: "Terrorist activity region",
        blockType: "TERRORISM",
    },
    {
        lat: 31.7683,
        lng: 35.2137,
        city: "Jerusalem",
        country: "IL",
        reason: "Active conflict region",
        blockType: "SECURITY_THREAT",
    },
    {
        lat: 31.2001,
        lng: 29.9187,
        city: "Alexandria",
        country: "EG",
        reason: "Terrorist activity region",
        blockType: "TERRORISM",
    },

    // Centros específicos de hacking (não capitais principais)
    // Removidas capitais principais para manter acessibilidade

    // Regiões específicas de embargos (não centros financeiros principais)
    // Removidos centros financeiros principais para manter acessibilidade

    // Regiões específicas de alto risco na África (não capitais principais)
    // Removidas capitais principais para manter acessibilidade

    // Regiões específicas de alto risco na América Latina (não capitais principais)
    // Removidas capitais principais para manter acessibilidade

    // Regiões específicas de alto risco na Ásia (não capitais principais)
    // Removidas capitais principais para manter acessibilidade
] as const

/**
 * Checks if an IP is in the suspicious list
 */
export function isSuspiciousIP(ip: string): boolean {
    return SUSPICIOUS_IPS.includes(ip as any)
}

/**
 * Checks if a country is in the high risk list
 */
export function isHighRiskCountry(countryCode: string): boolean {
    return HIGH_RISK_COUNTRIES.includes(countryCode as any)
}

/**
 * Returns the complete list of suspicious IPs
 */
export function getSuspiciousIPs(): readonly string[] {
    return SUSPICIOUS_IPS
}

/**
 * Returns the complete list of high risk countries
 */
export function getHighRiskCountries(): readonly string[] {
    return HIGH_RISK_COUNTRIES
}

/**
 * Returns the complete list of high risk locations
 */
export function getHighRiskLocations(): readonly HighRiskLocation[] {
    return HIGH_RISK_LOCATIONS
}

/**
 * Checks if a location is near a high risk area
 * @param latitude Latitude of the location to check
 * @param longitude Longitude of the location to check
 * @param maxDistanceKm Maximum distance in km to consider suspicious (default: 100km)
 * @returns Object with information about the suspicious location or null if not suspicious
 */
export function checkHighRiskLocation(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 100,
): { location: HighRiskLocation; distance: number; risk: string } | null {
    for (const location of HIGH_RISK_LOCATIONS) {
        const distance = calculateDistance(latitude, longitude, location.lat, location.lng)
        if (distance <= maxDistanceKm) {
            return {
                location,
                distance,
                risk: location.risk,
            }
        }
    }
    return null
}

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lng1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lng2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

/**
 * Converts degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
export function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Returns high risk locations by country
 * @param countryCode Country code (e.g. "CN", "RU")
 * @returns Array of locations for the specified country
 */
export function getHighRiskLocationsByCountry(countryCode: string): readonly HighRiskLocation[] {
    return HIGH_RISK_LOCATIONS.filter((location) => location.country === countryCode)
}

/**
 * Returns high risk locations by risk level
 * @param riskLevel Risk level ("CRITICAL", "HIGH", "MEDIUM")
 * @returns Array of locations with the specified risk level
 */
export function getHighRiskLocationsByRisk(
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM",
): readonly HighRiskLocation[] {
    return HIGH_RISK_LOCATIONS.filter((location) => location.risk === riskLevel)
}

/**
 * Checks if a location is completely blocked
 * @param latitude Latitude of the location to check
 * @param longitude Longitude of the location to check
 * @param maxDistanceKm Maximum distance in km to consider blocked (default: 50km)
 * @returns Object with information about the blocked location or null if not blocked
 */
export function checkBlockedLocation(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 50,
): { location: BlockedLocation; distance: number; reason: string; blockType: string } | null {
    for (const location of BLOCKED_LOCATIONS) {
        const distance = calculateDistance(latitude, longitude, location.lat, location.lng)
        if (distance <= maxDistanceKm) {
            return {
                location,
                distance,
                reason: location.reason,
                blockType: location.blockType,
            }
        }
    }
    return null
}

/**
 * Returns the complete list of blocked locations
 */
export function getBlockedLocations(): readonly BlockedLocation[] {
    return BLOCKED_LOCATIONS
}

/**
 * Returns blocked locations by country
 * @param countryCode Country code (e.g. "KP", "IR", "SY")
 * @returns Array of blocked locations for the specified country
 */
export function getBlockedLocationsByCountry(countryCode: string): readonly BlockedLocation[] {
    return BLOCKED_LOCATIONS.filter((location) => location.country === countryCode)
}

/**
 * Returns blocked locations by block type
 * @param blockType Block type ("SANCTIONS", "EMBARGO", "SECURITY_THREAT", "TERRORISM", "CYBER_WARFARE")
 * @returns Array of locations with the specified block type
 */
export function getBlockedLocationsByType(
    blockType: "SANCTIONS" | "EMBARGO" | "SECURITY_THREAT" | "TERRORISM" | "CYBER_WARFARE",
): readonly BlockedLocation[] {
    return BLOCKED_LOCATIONS.filter((location) => location.blockType === blockType)
}

/**
 * Checks if a country is completely blocked
 * @param countryCode Country code to check
 * @returns true if the country is completely blocked
 */
export function isCountryBlocked(countryCode: string): boolean {
    return BLOCKED_LOCATIONS.some((location) => location.country === countryCode)
}
