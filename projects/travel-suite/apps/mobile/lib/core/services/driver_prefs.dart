import 'package:shared_preferences/shared_preferences.dart';

class DriverPrefs {
  DriverPrefs._();

  static final DriverPrefs instance = DriverPrefs._();

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  static const _onDutyKey = 'driver.onDuty';

  Future<bool> isOnDuty({bool fallback = false}) async {
    final p = await _prefs;
    return p.getBool(_onDutyKey) ?? fallback;
  }

  Future<void> setOnDuty(bool onDuty) async {
    final p = await _prefs;
    await p.setBool(_onDutyKey, onDuty);
  }

  String _checklistKey(String tripId, int dayNumber, String itemId) =>
      'driver.trip.$tripId.day.$dayNumber.checklist.$itemId.done';

  Future<bool> isChecklistDone(
    String tripId,
    int dayNumber,
    String itemId,
  ) async {
    final p = await _prefs;
    return p.getBool(_checklistKey(tripId, dayNumber, itemId)) ?? false;
  }

  Future<void> setChecklistDone(
    String tripId,
    int dayNumber,
    String itemId,
    bool done,
  ) async {
    final p = await _prefs;
    await p.setBool(_checklistKey(tripId, dayNumber, itemId), done);
  }
}
