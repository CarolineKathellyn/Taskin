import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { DateUtils } from '../../utils';

interface DatePickerProps {
  label?: string;
  value?: string;
  onDateChange: (date: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  error,
  required = false,
  placeholder = 'Selecionar data',
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const formatted = DateUtils.formatDate(dateString);
      console.log('DatePicker: Formatting date', dateString, '->', formatted);
      return formatted;
    } catch {
      return dateString;
    }
  };

  const handleDateSelect = (day: any) => {
    // day.dateString is already in YYYY-MM-DD format from the calendar
    const selectedDate = day.dateString;
    console.log('DatePicker: Selected date from calendar:', selectedDate);
    onDateChange(selectedDate);
    setShowCalendar(false);
  };

  const clearDate = () => {
    onDateChange('');
  };

  const getMarkedDates = () => {
    if (!value) return {};

    return {
      [value]: {
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: Colors.background,
      }
    };
  };

  const renderCalendar = () => (
    <Modal
      visible={showCalendar}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCalendar(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Data</Text>
            <View style={styles.headerButtons}>
              {value && (
                <TouchableOpacity onPress={clearDate} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeButton}>
                <Ionicons name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Calendar
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            minDate={DateUtils.getCurrentDateStringBrazil()}
            theme={{
              backgroundColor: Colors.background,
              calendarBackground: Colors.background,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.background,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.text,
              textDisabledColor: Colors.disabled,
              dotColor: Colors.primary,
              selectedDotColor: Colors.background,
              arrowColor: Colors.primary,
              disabledArrowColor: Colors.disabled,
              monthTextColor: Colors.text,
              indicatorColor: Colors.primary,
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.inputContainer, error && styles.error]}
        onPress={() => setShowCalendar(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
        <Text style={[styles.input, !value && styles.placeholder]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={clearDate} style={styles.clearIconButton}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {renderCalendar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  error: {
    borderColor: Colors.danger,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 10,
  },
  placeholder: {
    color: Colors.placeholder,
  },
  clearIconButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.danger,
    borderRadius: 6,
  },
  clearButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  calendar: {
    paddingBottom: 20,
  },
});