import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

/// Best-effort geocoding for itinerary locations when explicit coordinates
/// aren't available.
///
/// Uses Nominatim (OpenStreetMap). Keep requests throttled and cached.
class GeocodingService {
  GeocodingService._();

  static final GeocodingService instance = GeocodingService._();

  final Map<String, LatLng> _cache = {};
  final Set<String> _inFlight = {};
  Future<void> _queue = Future.value();
  DateTime _lastRequestAt = DateTime.fromMillisecondsSinceEpoch(0);

  LatLng? getCached(String query) => _cache[query.trim()];

  Future<LatLng?> geocode(String rawQuery) async {
    final query = rawQuery.trim();
    if (query.isEmpty) return null;

    final cached = _cache[query];
    if (cached != null) return cached;

    if (_inFlight.contains(query)) {
      // Wait for the existing request to complete.
      await _queue;
      return _cache[query];
    }

    _inFlight.add(query);
    final completer = Completer<LatLng?>();

    _queue = _queue.then((_) async {
      try {
        final now = DateTime.now();
        final wait = _lastRequestAt
            .add(const Duration(milliseconds: 1100))
            .difference(now);
        if (!wait.isNegative) {
          await Future.delayed(wait);
        }
        _lastRequestAt = DateTime.now();

        final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
          'q': query,
          'format': 'jsonv2',
          'limit': '1',
        });

        final resp = await http
            .get(
              uri,
              headers: const {
                // Nominatim requires an identifying User-Agent.
                'User-Agent': 'GoBuddyMobile/0.1 (Travel Suite Flutter)',
                'Accept': 'application/json',
              },
            )
            .timeout(const Duration(seconds: 8));

        if (resp.statusCode < 200 || resp.statusCode >= 300) {
          completer.complete(null);
          return;
        }

        final decoded = jsonDecode(resp.body);
        if (decoded is! List || decoded.isEmpty) {
          completer.complete(null);
          return;
        }
        final first = decoded.first;
        if (first is! Map) {
          completer.complete(null);
          return;
        }

        final lat = double.tryParse(first['lat']?.toString() ?? '');
        final lon = double.tryParse(first['lon']?.toString() ?? '');
        if (lat == null || lon == null) {
          completer.complete(null);
          return;
        }

        final point = LatLng(lat, lon);
        _cache[query] = point;
        completer.complete(point);
      } catch (_) {
        completer.complete(null);
      } finally {
        _inFlight.remove(query);
      }
    });

    return completer.future;
  }
}
