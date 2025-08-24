import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

const TermsOfServiceScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.paragraph}>
        By downloading, installing, or using the Sapphire (“App”), you acknowledge that you have 
        read, understood, and agree to be bound by these Terms of Service (“Terms”). If you do not 
        agree to these Terms, do not use the App.
      </Text>

      <Text style={styles.sectionTitle}>2. Changes to Terms</Text>
      <Text style={styles.paragraph}>
        We reserve the right to modify these Terms at any time. We will notify you of any changes 
        by posting the new Terms of Service on this page and updating the “Last Updated” date. 
        Your continued use of the App after any revisions indicates that you accept the revised Terms.
      </Text>

      <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
      <Text style={styles.paragraph}>
        • You agree to use the App for lawful purposes only.
        {"\n"}• You are responsible for maintaining the confidentiality of any login or account 
        credentials and for all activities that occur under your account.
        {"\n"}• You agree not to interfere with or disrupt the App, servers, or networks 
        connected to the App.
      </Text>

      <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
      <Text style={styles.paragraph}>
        All content, features, and functionality (including but not limited to text, graphics, 
        and logos) within the App are the exclusive property of Sapphire or its licensors. 
        You agree not to reproduce, distribute, or create derivative works from any part of 
        the App without prior written permission.
      </Text>

      <Text style={styles.sectionTitle}>5. Termination</Text>
      <Text style={styles.paragraph}>
        We reserve the right to terminate or suspend your access to the App at our discretion, 
        without prior notice, for conduct that we believe violates these Terms or is harmful 
        to other users, us, or third parties.
      </Text>

      <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
      <Text style={styles.paragraph}>
        In no event shall Sapphire be liable for any direct, indirect, incidental, special, 
        consequential, or exemplary damages arising out of or in connection with your use 
        of or inability to use the App. This includes, but is not limited to, any loss of 
        profits, data, goodwill, or other intangible losses.
      </Text>

      <Text style={styles.sectionTitle}>7. Governing Law</Text>
      <Text style={styles.paragraph}>
        These Terms and any disputes related to them will be governed by and interpreted in 
        accordance with the laws of your jurisdiction, without regard to its conflict of law rules.
      </Text>

      <Text style={styles.sectionTitle}>8. Contact Us</Text>
      <Text style={styles.paragraph}>
        If you have any questions regarding these Terms, please contact us at:
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
});

export default TermsOfServiceScreen;
