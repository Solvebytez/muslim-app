import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation();
  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10ac84" />
      
      {/* Header */}
        {/* Header */}
         <View style={styles.header}>
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#fff" />
             {/* Or use <Text style={styles.backText}>←</Text> */}
           </TouchableOpacity>
                 <Text style={styles.headerTitle}>{"Privacy Policy"}</Text>
               </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* App Name and Date */}
          <View style={styles.titleSection}>
            <Text style={styles.appName}>Muslim Compass</Text>
            <Text style={styles.effectiveDate}>Effective Date: July 7, 2025</Text>
            <Text style={styles.lastUpdated}>Last Updated: July 10, 2025</Text>
          </View>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionContent}>
              Welcome to Muslim Compass, your comprehensive Islamic lifestyle companion. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
            </Text>
            <Text style={styles.sectionContent}>
              By using Muslim Compass, you agree to the collection and use of information in accordance with this Privacy Policy.
            </Text>
          </View>

          {/* Information We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            
            <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
            <Text style={styles.sectionContent}>
              • Account Information: Name, email address, phone number when you register{'\n'}
              • Profile Information: Religious preferences, prayer notification settings{'\n'}
              • Vendor Information: Business details, certifications, contact information (for vendor accounts)
            </Text>

            <Text style={styles.subSectionTitle}>2.2 Location Information</Text>
            <Text style={styles.sectionContent}>
              • Current Location: To show nearby mosques within 15km radius{'\n'}
              • Location History: To provide accurate prayer times for your area{'\n'}
              • Restaurant/Hotel Locations: To display halal establishments near you
            </Text>

            <Text style={styles.subSectionTitle}>2.3 Usage Information</Text>
            <Text style={styles.sectionContent}>
              • App Activity: Features used, time spent, prayer time notifications{'\n'}
              • Device Information: Device type, operating system, unique device identifiers{'\n'}
              • Log Data: IP address, app crashes, performance data
            </Text>
          </View>

          {/* How We Use Your Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            
            <Text style={styles.subSectionTitle}>3.1 Core App Functions</Text>
            <Text style={styles.sectionContent}>
              • Prayer Times: Calculate and display accurate prayer times based on your location{'\n'}
              • Notifications: Send prayer time reminders and Islamic calendar notifications{'\n'}
              • Mosque Finder: Show nearby mosques within 15km of your location{'\n'}
              • Halal Directory: Display halal restaurants and hotels near your current location
            </Text>

            <Text style={styles.subSectionTitle}>3.2 Vendor Services</Text>
            <Text style={styles.sectionContent}>
              • Business Listings: Allow vendors to add and manage their halal establishments{'\n'}
              • Verification: Verify halal certifications and business authenticity{'\n'}
              • Communication: Facilitate communication between users and vendors
            </Text>
          </View>

          {/* Information Sharing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>
            
            <Text style={styles.subSectionTitle}>4.1 We Share Information:</Text>
            <Text style={styles.sectionContent}>
              • With Vendors: Location data to show relevant nearby establishments{'\n'}
              • Service Providers: Third-party services for maps, notifications, and analytics{'\n'}
              • Legal Requirements: When required by law or to protect rights and safety
            </Text>

            <Text style={styles.subSectionTitle}>4.2 We Do NOT Share:</Text>
            <Text style={styles.sectionContent}>
              • Personal Information: We never sell your personal data to third parties{'\n'}
              • Prayer Data: Your prayer habits and religious practices remain private{'\n'}
              • Location History: Detailed location tracking beyond necessary app functions
            </Text>
          </View>

          {/* Location Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Location Services</Text>
            
            <Text style={styles.subSectionTitle}>5.1 Why We Use Location:</Text>
            <Text style={styles.sectionContent}>
              • Prayer Times: Calculate accurate prayer times for your specific location{'\n'}
              • Nearby Mosques: Find mosques within 15km radius{'\n'}
              • Halal Establishments: Show restaurants and hotels near your current location{'\n'}
              • Local Notifications: Provide location-appropriate Islamic content
            </Text>

            <Text style={styles.subSectionTitle}>5.2 Location Control:</Text>
            <Text style={styles.sectionContent}>
              • You can disable location services in your device settings{'\n'}
              • App functionality may be limited without location access{'\n'}
              • Location data is not stored permanently on our servers
            </Text>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Notifications</Text>
            
            <Text style={styles.subSectionTitle}>6.1 Prayer Notifications:</Text>
            <Text style={styles.sectionContent}>
              • Daily Prayer Times: Adhan notifications for five daily prayers{'\n'}
              • Customizable: Adjust timing, sound, and frequency{'\n'}
              • Opt-out: Disable notifications anytime in app settings
            </Text>

            <Text style={styles.subSectionTitle}>6.2 App Notifications:</Text>
            <Text style={styles.sectionContent}>
              • New Establishments: Nearby halal restaurants and hotels{'\n'}
              • Islamic Calendar: Important Islamic dates and events{'\n'}
              • App Updates: Feature updates and improvements
            </Text>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Data Security</Text>
            
            <Text style={styles.subSectionTitle}>7.1 Security Measures:</Text>
            <Text style={styles.sectionContent}>
              • Encryption: All data transmitted using SSL/TLS encryption{'\n'}
              • Secure Storage: Personal information stored on secure servers{'\n'}
              • Access Control: Limited access to authorized personnel only{'\n'}
              • Regular Updates: Security protocols updated regularly
            </Text>

            <Text style={styles.subSectionTitle}>7.2 Account Security:</Text>
            <Text style={styles.sectionContent}>
              • Password Protection: Secure your account with strong passwords{'\n'}
              • Two-Factor Authentication: Optional enhanced security{'\n'}
              • Account Monitoring: Monitor for suspicious activity
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Your Rights and Choices</Text>
            
            <Text style={styles.subSectionTitle}>8.1 Access and Control:</Text>
            <Text style={styles.sectionContent}>
              • Account Settings: Update personal information anytime{'\n'}
              • Privacy Settings: Control what information is shared{'\n'}
              • Data Export: Request a copy of your data{'\n'}
              • Account Deletion: Delete your account and associated data
            </Text>

            <Text style={styles.subSectionTitle}>8.2 Communication Preferences:</Text>
            <Text style={styles.sectionContent}>
              • Notification Settings: Customize prayer and app notifications{'\n'}
              • Marketing Communications: Opt-out of promotional messages{'\n'}
              • Vendor Communications: Control communication from businesses
            </Text>
          </View>

          {/* Children's Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. {"Children's"} Privacy</Text>
            <Text style={styles.sectionContent}>
              Muslim Compass is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Contact Information</Text>
            <Text style={styles.sectionContent}>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactItem}>📧 Email: githubsolvebytez@gmail.com</Text>
              {/* <Text style={styles.contactItem}>🏢 Address: [Your Company Address]</Text>
              <Text style={styles.contactItem}>📞 Phone: [Your Contact Number]</Text>
              <Text style={styles.contactItem}>🌐 Website: [Your Website]</Text> */}
            </View>
          </View>

          {/* Consent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Consent</Text>
            <Text style={styles.sectionContent}>
              By using Muslim Compass, you consent to our Privacy Policy and agree to its terms and conditions.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This privacy policy is designed to be comprehensive and compliant with major privacy regulations.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
 header: {
   flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#10ac84",
    backgroundColor: "#10ac84",
    justifyContent: "flex-start",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10ac84',
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10ac84',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10ac84',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 8,
  },
  contactInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  contactItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  footer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen;