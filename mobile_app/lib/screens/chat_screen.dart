import 'package:flutter/material.dart';
import 'package:dids_mobile/models/did_document.dart';
import 'package:dids_mobile/services/did_service.dart';
import 'package:dids_mobile/widgets/did_request_card.dart';

class ChatScreen extends StatefulWidget {
  final String deviceId;
  final String deviceName;

  const ChatScreen({
    super.key,
    required this.deviceId,
    required this.deviceName,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<DidDocument> dids = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDids();
  }

  Future<void> _loadDids() async {
    setState(() {
      isLoading = true;
    });

    try {
      final allDids = await DidService.getAllDids();
      if (mounted) {
        setState(() {
          dids = allDids;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar DIDs: $e')),
        );
      }
    }
  }

  Future<void> _createDid() async {
    final didData = {
      'did': 'did:example:${DateTime.now().millisecondsSinceEpoch}',
      'owner': widget.deviceId,
      'content': {
        'type': 'VerifiableCredential',
        'issuer': widget.deviceName,
        'subject': 'Usuario del dispositivo ${widget.deviceName}',
        'claims': {
          'name': 'Usuario ${widget.deviceName}',
          'email': 'usuario@${widget.deviceName.toLowerCase()}.com',
          'createdAt': DateTime.now().toIso8601String(),
        },
      },
    };

    try {
      final newDid = await DidService.createDid(didData);
      if (mounted) {
        setState(() {
          dids.insert(0, newDid);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('DID creado exitosamente')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al crear DID: $e')),
        );
      }
    }
  }

  Future<void> _approveDid(String didId) async {
    try {
      final updatedDid = await DidService.approveDid(didId, widget.deviceId);
      if (mounted) {
        setState(() {
          final index = dids.indexWhere((did) => did.id == didId);
          if (index != -1) {
            dids[index] = updatedDid;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('DID aprobado exitosamente')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al aprobar DID: $e')),
        );
      }
    }
  }

  Future<void> _rejectDid(String didId) async {
    final reasonController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rechazar DID'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            labelText: 'Razón del rechazo',
            hintText: 'Ingresa la razón por la que rechazas este DID',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              if (reasonController.text.isNotEmpty) {
                try {
                  final updatedDid = await DidService.rejectDid(
                    didId,
                    widget.deviceId,
                    reasonController.text,
                  );
                  if (mounted) {
                    setState(() {
                      final index = dids.indexWhere((did) => did.id == didId);
                      if (index != -1) {
                        dids[index] = updatedDid;
                      }
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('DID rechazado exitosamente')),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error al rechazar DID: $e')),
                    );
                  }
                }
              }
            },
            child: const Text('Rechazar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF075E54), // Color WhatsApp
      appBar: AppBar(
        backgroundColor: const Color(0xFF075E54),
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                widget.deviceName[0].toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFF075E54),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.deviceName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Sistema DIDs',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadDids,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header con estadísticas
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF128C7E),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard('Total', '${dids.length}', Colors.white),
                _buildStatCard('Pendientes', '${dids.where((d) => d.status == 'pending').length}', Colors.orange),
                _buildStatCard('Aprobados', '${dids.where((d) => d.status == 'approved').length}', Colors.green),
                _buildStatCard('Rechazados', '${dids.where((d) => d.status == 'rejected').length}', Colors.red),
              ],
            ),
          ),
          
          // Lista de DIDs
          Expanded(
            child: Container(
              decoration: const BoxDecoration(
                color: Color(0xFFECE5DD), // Color de fondo WhatsApp
              ),
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : dids.isEmpty
                      ? const Center(
                          child: Text(
                            'No hay DIDs disponibles',
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: dids.length,
                          itemBuilder: (context, index) {
                            final did = dids[index];
                            return DidRequestCard(
                              did: did,
                              deviceId: widget.deviceId,
                              onApprove: () => _approveDid(did.id),
                              onReject: () => _rejectDid(did.id),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createDid,
        backgroundColor: const Color(0xFF25D366), // Color verde WhatsApp
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}
