"use client"

import { Ionicons } from "@expo/vector-icons"
import { useEffect, useMemo, useState } from "react"
import { Dimensions, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const { width: screenWidth } = Dimensions.get("window")

interface HijriDate {
  day: number
  month: number
  year: number
  monthName: string
  weekday: string
}

interface HijriCalendarProps {
  visible: boolean
  onClose: () => void
  currentHijriDate?: string // Format: "DD-MM-YYYY" or similar
  currentGregorianDate?: string
}

// Hijri month names
const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
]

// Important Islamic dates - properly typed for string indexing
const ISLAMIC_EVENTS: Record<string, string> = {
  "1-1": "Islamic New Year",
  "10-1": "Day of Ashura",
  "12-3": "Mawlid al-Nabi",
  "27-7": "Isra and Mi'raj",
  "15-8": "Laylat al-Bara'at",
  "1-9": "First Day of Ramadan",
  "27-9": "Laylat al-Qadr (estimated)",
  "1-10": "Eid al-Fitr",
  "9-12": "Day of Arafah",
  "10-12": "Eid al-Adha",
}

interface CalendarDay {
  day: number
  isToday: boolean
  isSpecial: boolean
  event?: string
}

export default function HijriCalendar({
  visible,
  onClose,
  currentHijriDate,
  currentGregorianDate,
}: HijriCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(1446) // Current Hijri year (approximate)

  // Parse current Hijri date
  const parsedCurrentDate = useMemo(() => {
    if (!currentHijriDate) return null

    try {
      // Handle different date formats
      const parts = currentHijriDate.split(/[-/\s]/)
      if (parts.length >= 3) {
        return {
          day: Number.parseInt(parts[0]),
          month: Number.parseInt(parts[1]),
          year: Number.parseInt(parts[2]),
          monthName: HIJRI_MONTHS[Number.parseInt(parts[1]) - 1] || "",
          weekday: "",
        }
      }
    } catch (error) {
      console.log("Error parsing Hijri date:", error)
    }
    return null
  }, [currentHijriDate])

  // Set initial month/year from current date
  useEffect(() => {
    if (parsedCurrentDate) {
      setCurrentMonth(parsedCurrentDate.month)
      setCurrentYear(parsedCurrentDate.year)
    }
  }, [parsedCurrentDate])

  // Generate calendar days for current month
  const calendarDays = useMemo((): (CalendarDay | null)[] => {
    const daysInMonth = 30 // Simplified - Hijri months are typically 29-30 days
    const days: (CalendarDay | null)[] = []

    // Add empty cells for proper alignment (simplified)
    const startDay = 1 // Simplified start day

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${day}-${currentMonth}`
      const event = ISLAMIC_EVENTS[dateKey]
      const isToday = parsedCurrentDate?.day === day && parsedCurrentDate?.month === currentMonth
      const isSpecial = !!event

      days.push({
        day,
        isToday,
        isSpecial,
        event,
      })
    }

    return days
  }, [currentMonth, currentYear, parsedCurrentDate])

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const currentMonthName = HIJRI_MONTHS[currentMonth - 1] || ""

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>Hijri Calendar</Text>
            <Text style={styles.headerSubtext}>Islamic Calendar</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Date Info */}
          {parsedCurrentDate && (
            <View style={styles.currentDateCard}>
              <View style={styles.currentDateHeader}>
                <Ionicons name="calendar" size={24} color="#4A5FBF" />
                <Text style={styles.currentDateTitle}>Today</Text>
              </View>
              <Text style={styles.currentHijriDate}>
                {parsedCurrentDate.day} {parsedCurrentDate.monthName} {parsedCurrentDate.year} AH
              </Text>
              {currentGregorianDate && (
                <Text style={styles.currentGregorianDate}>Corresponding to: {currentGregorianDate}</Text>
              )}
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth("prev")} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#4A5FBF" />
            </TouchableOpacity>
            <View style={styles.monthYearContainer}>
              <Text style={styles.monthText}>{currentMonthName}</Text>
              <Text style={styles.yearText}>{currentYear} AH</Text>
            </View>
            <TouchableOpacity onPress={() => navigateMonth("next")} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#4A5FBF" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayData, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  dayData?.isToday && styles.todayCell,
                  dayData?.isSpecial && styles.specialDayCell,
                ]}
                onPress={() => {
                  if (dayData) {
                    const selectedHijriDate: HijriDate = {
                      day: dayData.day,
                      month: currentMonth,
                      year: currentYear,
                      monthName: HIJRI_MONTHS[currentMonth - 1] || "",
                      weekday: "", // You can add weekday calculation if needed
                    }
                    setSelectedDate(selectedHijriDate)
                  }
                }}
                disabled={!dayData}
              >
                {dayData && (
                  <>
                    <Text
                      style={[
                        styles.dayText,
                        dayData.isToday && styles.todayText,
                        dayData.isSpecial && styles.specialDayText,
                      ]}
                    >
                      {dayData.day}
                    </Text>
                    {dayData.isSpecial && <View style={styles.eventDot} />}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Islamic Events for Current Month */}
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>Islamic Events in {currentMonthName}</Text>
            {Object.entries(ISLAMIC_EVENTS)
              .filter(([dateKey]) => {
                const [, month] = dateKey.split("-")
                return Number.parseInt(month) === currentMonth
              })
              .map(([dateKey, eventName]) => {
                const [day] = dateKey.split("-")
                return (
                  <View key={dateKey} style={styles.eventItem}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDayText}>{day}</Text>
                    </View>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventName}>{eventName}</Text>
                      <Text style={styles.eventDateText}>
                        {day} {currentMonthName} {currentYear} AH
                      </Text>
                    </View>
                  </View>
                )
              })}
          </View>

          {/* Hijri Calendar Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About the Hijri Calendar</Text>
            <Text style={styles.infoText}>
              The Hijri calendar is a lunar calendar consisting of 12 months in a year of 354 or 355 days. It is used to
              determine the proper days of Islamic holidays and rituals, such as the annual period of fasting and the
              proper time for the Hajj pilgrimage.
            </Text>
            <Text style={styles.infoText}>
              The calendar started in the year 622 CE, marking the Hijra (migration) of Prophet Muhammad from Mecca to
              Medina.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentDateCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentDateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5FBF",
    marginLeft: 8,
  },
  currentHijriDate: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  currentGregorianDate: {
    fontSize: 14,
    color: "#666",
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthYearContainer: {
    alignItems: "center",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  yearText: {
    fontSize: 16,
    color: "#666",
    marginTop: 2,
  },
  weekdayHeader: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
  },
  dayCell: {
    width: (screenWidth - 56) / 7, // Account for padding and margins
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  todayCell: {
    backgroundColor: "#4A5FBF",
    borderRadius: 8,
  },
  specialDayCell: {
    backgroundColor: "#10ac8410",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  todayText: {
    color: "white",
    fontWeight: "600",
  },
  specialDayText: {
    color: "#10ac84",
    fontWeight: "600",
  },
  eventDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10ac84",
  },
  eventsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  eventDate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A5FBF10",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  eventDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5FBF",
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  eventDateText: {
    fontSize: 14,
    color: "#666",
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
})
