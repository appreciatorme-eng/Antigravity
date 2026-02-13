import 'package:shared_preferences/shared_preferences.dart';

class TravelerPrefs {
  TravelerPrefs._();

  static final TravelerPrefs instance = TravelerPrefs._();

  static const _homeCurrencyKey = 'traveler.homeCurrency';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  Future<String> getHomeCurrency({String fallback = 'USD'}) async {
    final p = await _prefs;
    return p.getString(_homeCurrencyKey) ?? fallback;
  }

  Future<void> setHomeCurrency(String code) async {
    final p = await _prefs;
    await p.setString(_homeCurrencyKey, code);
  }

  String _checklistKey(String tripId, String itemId) =>
      'trip.$tripId.checklist.$itemId.done';

  Future<bool> isChecklistDone(String tripId, String itemId) async {
    final p = await _prefs;
    return p.getBool(_checklistKey(tripId, itemId)) ?? false;
  }

  Future<void> setChecklistDone(String tripId, String itemId, bool done) async {
    final p = await _prefs;
    await p.setBool(_checklistKey(tripId, itemId), done);
  }

  String _reviewKey(String tripId) => 'trip.$tripId.review.rating';

  Future<int?> getReviewRating(String tripId) async {
    final p = await _prefs;
    final v = p.getInt(_reviewKey(tripId));
    if (v == null || v < 1 || v > 5) return null;
    return v;
  }

  Future<void> setReviewRating(String tripId, int rating) async {
    final p = await _prefs;
    await p.setInt(_reviewKey(tripId), rating);
  }
}
