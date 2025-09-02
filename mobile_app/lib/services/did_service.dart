import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/did_document.dart';

class DidService {
  // Usar el servidor de prueba sin autenticación para diagnóstico
  static const String baseUrl = 'http://127.0.0.1:3003/api';
  static const String apiKey = 'your-api-key'; // En producción usar autenticación real

  // Obtener todos los DIDs
  static Future<List<DidDocument>> getAllDids() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dids'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => DidDocument.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener DIDs: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Crear un nuevo DID
  static Future<DidDocument> createDid(Map<String, dynamic> didData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/dids'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: json.encode(didData),
      );

      if (response.statusCode == 201) {
        return DidDocument.fromJson(json.decode(response.body));
      } else {
        throw Exception('Error al crear DID: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Aprobar un DID
  static Future<DidDocument> approveDid(String didId, String approverId) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/dids/$didId/approve'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: json.encode({'approverId': approverId}),
      );

      if (response.statusCode == 200) {
        return DidDocument.fromJson(json.decode(response.body));
      } else {
        throw Exception('Error al aprobar DID: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Rechazar un DID
  static Future<DidDocument> rejectDid(String didId, String rejectorId, String reason) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/dids/$didId/reject'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
        body: json.encode({
          'rejectorId': rejectorId,
          'reason': reason,
        }),
      );

      if (response.statusCode == 200) {
        return DidDocument.fromJson(json.decode(response.body));
      } else {
        throw Exception('Error al rechazar DID: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener DIDs por propietario
  static Future<List<DidDocument>> getDidsByOwner(String ownerId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dids/owner/$ownerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => DidDocument.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener DIDs del propietario: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener DIDs pendientes
  static Future<List<DidDocument>> getPendingDids() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dids?status=pending'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $apiKey',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => DidDocument.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener DIDs pendientes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}
