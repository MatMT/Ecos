import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import CustomTopBar from '../../../../components/CustomTopBar';


export default function Home() {

    function GetDate() {
const [fecha] = useState(new Date());

  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  // Convierte la fecha al formato exacto de la imagen
  const fechaTexto = fecha.toLocaleDateString('es-ES', opciones);

  // Capitaliza la primera letra (opcional, por si el navegador la devuelve en minúscula)
  const fechaFormateada = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  return (
    fechaFormateada
  );
}
  return (
    <View style={styles.mainContainer}>
      <CustomTopBar/> 
      {/* 1. SCROLLVIEW PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Encabezado de Bienvenida */}
        <View style={styles.header}>
          <Text style={styles.title}>Tu bienestar hoy</Text>
          <Text style={styles.subtitle}>{GetDate()}</Text>
        </View>

        {/* Tarjeta de Estado Actual (IA) */}
        <View style={styles.aiCard}>
          <Text style={styles.aiTag}>● ESTADO ACTUAL • IA</Text>
          <Text style={styles.aiText}>"Te percibimos un poco estresada. ¿Quieres respirar un momento?"</Text>
          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Iniciar Respiración</Text>
          </TouchableOpacity>
        </View>

        {/* 2. CUADRÍCULA DE MÉTRICAS (GRID) */}
        <View style={styles.gridContainer}>
          {/* Fila 1 */}
          <View style={styles.gridRow}>
            <View style={[styles.metricCard, styles.borderLeftElevated]}>
              <Text style={styles.statusElevated}>Elevado</Text>
              <Text style={styles.metricValue}>99 <Text style={styles.metricUnit}>bpm</Text></Text>
              <Text style={styles.metricLabel}>Ritmo Cardíaco</Text>
            </View>
            <View style={[styles.metricCard, styles.borderLeftNormal]}>
              <Text style={styles.statusNormal}>Normal</Text>
              <Text style={styles.metricValue}>95 <Text style={styles.metricUnit}>%</Text></Text>
              <Text style={styles.metricLabel}>Oxígeno</Text>
            </View>
          </View>
          {/* Fila 2 */}
          <View style={styles.gridRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>37.2 <Text style={styles.metricUnit}>°C</Text></Text>
              <Text style={styles.metricLabel}>Temperatura</Text>
            </View>
            <View style={[styles.metricCard, styles.borderLeftHigh]}>
              <Text style={styles.statusHigh}>Alto</Text>
              <Text style={styles.metricValue}>88 <Text style={styles.metricUnit}>%</Text></Text>
              <Text style={styles.metricLabel}>Nivel de Estrés</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Tendencia de Estrés */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tendencia de Estrés</Text>
          <View style={styles.mockChart}>
            <Text style={styles.placeholderText}>[ Gráfico de Línea Aquí ]</Text>
          </View>
        </View>

        {/* Sección Atención Prioritaria */}
        <Text style={styles.sectionTitle}>ATENCIÓN PRIORITARIA</Text>
        <TouchableOpacity style={styles.panicButton}>
          <View style={styles.panicLeft}>
            <View style={styles.panicIconPlaceholder} />
            <View>
              <Text style={styles.panicText}>Botón de Pánico</Text>
              <Text style={styles.panicSubtext}>Contactar a Dr. Méndez</Text>
            </View>
          </View>
          <Text style={styles.arrowIcon}>&gt;</Text>
        </TouchableOpacity>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Fondo gris muy claro de la app
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100, // Espacio para que la barra inferior no tape el contenido
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  aiTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 10,
  },
  aiText: {
    fontSize: 19,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 15,
  },
  aiButton: {
    backgroundColor: '#005F54', // Verde oscuro del botón
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gridContainer: {
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%', // Distribuye dos tarjetas por fila
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
    elevation: 2,
  },
  borderLeftNormal: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669'
  },
  borderLeftElevated: {
    borderLeftWidth: 4,
    borderLeftColor: '#efb644',
  },
  borderLeftHigh: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  statusElevated: {
    alignSelf: 'flex-end',
    color: '#efb644',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusNormal: {
    alignSelf: 'flex-end',
    color: '#059669',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusHigh: {
    alignSelf: 'flex-end',
    color: '#DC2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#64748B',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
  },
  mockChart: {
    height: 150,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 10,
    letterSpacing: 1,
  },
  panicButton: {
    backgroundColor: '#FFF1F2', // Fondo rojizo suave
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panicIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626', // Rojo del botón médico
    marginRight: 12,
  },
  panicText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  panicSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#94A3B8',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    fontSize: 12,
    color: '#94A3B8',
  },
  navItemActive: {
    fontSize: 12,
    color: '#005F54',
    fontWeight: 'bold',
  },
});

