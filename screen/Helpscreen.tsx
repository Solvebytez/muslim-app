import axiosInstance from '@/constants/AxiosInstane';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface HelpSupportScreenProps {
  navigation: any; // Replace with proper navigation type if using TypeScript strictly
}

const HelpSupportScreen = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
   // Trim and count words
  const subjectWords = subject.trim().split(/\s+/).filter(Boolean);
  const descriptionWords = description.trim().split(/\s+/).filter(Boolean);

  // Validation
  if (!subject.trim() || !description.trim()) {
    Alert.alert('Error', 'Please fill in both subject and description fields.');
    return;
  }

  if (subjectWords.length > 100) {
    Alert.alert('Error', 'Subject cannot exceed 100 words.');
    return;
  }

  if (descriptionWords.length > 1000) {
    Alert.alert('Error', 'Description cannot exceed 1000 words.');
    return;
  }

    setIsSubmitting(true);
    
    try {
      // Replace this with your actual API call to send the form data
      // Example: await sendHelpRequest({ subject, description });
      const response = await axiosInstance.post('/support-ticket', { subject, description });

            if (response.status !== 201) {
    Alert.alert(
      'Failed',
      "Your message couldn't be sent. Please try again.",
      [
        {
          text: 'OK',
          onPress: () => {
            // Optional: Clear input if needed
            setSubject('');
            setDescription('');
          },
        },
      ]
    );
    return; // Stop further execution
  }
      
      Alert.alert(
        'Success',
        'Your message has been sent successfully. We will get back to you soon.Wait for admin response.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSubject('');
              setDescription('');
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.log("error", error);
       if (error) {
    Alert.alert(
      'Failed',
      "Your message couldn't be sent. Please try again.",
      [
        {
          text: 'OK',
          onPress: () => {
            // Optional: Clear input if needed
            setSubject('');
            setDescription('');
          },
        },
      ]
    );
    return; // Stop further execution
  }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
         <StatusBar barStyle="light-content" backgroundColor="#10ac84" />
      {/* Header */}
    <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        {/* Or use <Text style={styles.backText}>←</Text> */}
      </TouchableOpacity>
            <Text style={styles.headerTitle}>{"Help & Support"}</Text>
          </View>
    

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              {"We're"} here to help! Send us a message and {"we'll"} get back to you as soon as possible.
            </Text>

            {/* Subject Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Enter the subject of your inquiry"
                placeholderTextColor="#999"
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Please describe your issue or question in detail..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {description.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!subject.trim() || !description.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!subject.trim() || !description.trim() || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginLeft: -9,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40, // Balance the header
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#10ac84',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpSupportScreen;