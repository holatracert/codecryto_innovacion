import 'package:flutter/material.dart';
import 'screens/chat_screen.dart';

void main() {
  runApp(const DidsApp());
}

class DidsApp extends StatelessWidget {
  const DidsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DIDs Mobile',
      theme: ThemeData(
        primarySwatch: Colors.green,
        primaryColor: const Color(0xFF075E54),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF075E54),
        ),
        useMaterial3: true,
      ),
      home: const DeviceSelectionScreen(),
    );
  }
}

class DeviceSelectionScreen extends StatefulWidget {
  const DeviceSelectionScreen({super.key});

  @override
  State<DeviceSelectionScreen> createState() => _DeviceSelectionScreenState();
}

class _DeviceSelectionScreenState extends State<DeviceSelectionScreen> {
  final TextEditingController _deviceNameController = TextEditingController();
  final TextEditingController _deviceIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Generar IDs únicos para los dispositivos
    _deviceIdController.text = 'device_${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF075E54),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo y título
              const Icon(
                Icons.verified_user,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 24),
              const Text(
                'Sistema DIDs',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Decentralized Identifiers',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 48),
              
              // Formulario de configuración
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const Text(
                      'Configurar Dispositivo',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Campo nombre del dispositivo
                    TextField(
                      controller: _deviceNameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre del Dispositivo',
                        hintText: 'Ej: Mi iPhone, Mi Android',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.phone_android),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Campo ID del dispositivo
                    TextField(
                      controller: _deviceIdController,
                      decoration: const InputDecoration(
                        labelText: 'ID del Dispositivo',
                        hintText: 'Identificador único',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.fingerprint),
                      ),
                      readOnly: true,
                    ),
                    const SizedBox(height: 24),
                    
                    // Botón para continuar
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () => _startChat(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                        ),
                        child: const Text(
                          'Iniciar Chat',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Información adicional
              const Text(
                'Selecciona un nombre para tu dispositivo y comienza a usar el sistema DIDs',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _startChat() {
    if (_deviceNameController.text.isNotEmpty) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            deviceId: _deviceIdController.text,
            deviceName: _deviceNameController.text,
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, ingresa un nombre para tu dispositivo'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _deviceNameController.dispose();
    _deviceIdController.dispose();
    super.dispose();
  }
}
