import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>1. Introduction</Text>
      <Text style={styles.paragraph}>
        Welcome to Sapphire (“App”). This Privacy Policy explains how Sapphire (“we,” “us,” or “our”) 
        collects, uses, discloses, and safeguards your information when you use our App. 
        By using the App, you agree to the terms of this Privacy Policy. If you do not agree, 
        please do not access or use the App.
      </Text>

      <Text style={styles.sectionTitle}>2. Information We Collect</Text>
      <Text style={styles.paragraph}>
        <Text style={styles.bold}>a) Personal Data:</Text> We may collect personal information 
        you provide to us, such as your name, email address, and any other data you choose 
        to share when you create an account or interact with the App.
      </Text>
      <Text style={styles.paragraph}>
        <Text style={styles.bold}>b) Usage Data:</Text> We may automatically collect information 
        about how you use our App, including the time and date of your visits, your interactions 
        with the features of the App, the type of device you use, and other diagnostic data.
      </Text>

      <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
      <Text style={styles.paragraph}>We use the information we collect to:</Text>
      <Text style={styles.listItem}>
        • Provide, maintain, and improve the App’s functionality and user experience.
      </Text>
      <Text style={styles.listItem}>
        • Respond to your questions and requests, and offer customer support.
      </Text>
      <Text style={styles.listItem}>
        • Monitor usage to identify trends, usage patterns, or potential areas for improvement.
      </Text>
      <Text style={styles.listItem}>
        • Protect against unauthorized or illegal activity, fraud, and security breaches.
      </Text>

      <Text style={styles.sectionTitle}>4. Disclosure of Your Information</Text>
      <Text style={styles.paragraph}>We may share your information:</Text>
      <Text style={styles.listItem}>
        • With service providers who assist us in operating the App or conducting our business.
      </Text>
      <Text style={styles.listItem}>
        • If required by law or in response to valid requests by public authorities.
      </Text>
      <Text style={styles.listItem}>
        • To protect our rights, privacy, safety, or property, or that of others.
      </Text>

      <Text style={styles.sectionTitle}>5. Data Security</Text>
      <Text style={styles.paragraph}>
        We use reasonable security measures to protect your personal data. However, no method 
        of transmission over the internet or method of electronic storage is completely secure 
        and reliable, and we cannot guarantee its absolute security.
      </Text>

      <Text style={styles.sectionTitle}>6. Children’s Privacy</Text>
      <Text style={styles.paragraph}>
        Our App is not directed to children under the age of 13. If we learn that personal 
        information of individuals less than 13 years of age has been collected without 
        verifiable parental consent, we will take the appropriate steps to delete that information.
      </Text>

      <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
      <Text style={styles.paragraph}>
        We may update this Privacy Policy from time to time. We will notify you of any changes 
        by posting the new Privacy Policy on this page and updating the “Last Updated” date. 
        Your continued use of the App after any revisions indicates that you accept the terms 
        of the updated Privacy Policy.
      </Text>

      <Text style={styles.sectionTitle}>8. Contact Us</Text>
      <Text style={styles.paragraph}>
        If you have any questions or concerns about this Privacy Policy, please contact us at:
        {'\n'}fadyabirached@gmail.com
      </Text>

      <Text style={styles.paragraph}>
        Last Updated: 03/05/2025
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2C4F83', 
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    color: '#444',
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
    marginBottom: 5,
    color: '#444',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default PrivacyPolicyScreen;
