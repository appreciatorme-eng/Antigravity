import 'package:gobuddy_mobile/features/trips/domain/models/driver.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DriverRepository {
  final SupabaseClient _supabase;

  DriverRepository(this._supabase);

  Future<List<DriverAssignment>> getDriverAssignments(String tripId) async {
    try {
      final response = await _supabase
          .from('trip_driver_assignments')
          .select('*, driver:external_drivers(*)')
          .eq('trip_id', tripId);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) {
        // Map the correct structure for DriverAssignment
        // verify if 'driver' key exists and is not null
        final driverJson = json['driver'];
        final assignment = DriverAssignment.fromJson(json);
        
        // If driver info is present, we return the assignment with the driver object populated
        // Note: The fromJson on DriverAssignment might ignore 'driver' if we didn't add it to the custom logic or if we just manually attach it.
        // Actually, since DriverAssignment is immutable (freezed), we need to use copyWith.
        // Or better, handle it in parsing.
        
        if (driverJson != null) {
           return assignment.copyWith(driver: Driver.fromJson(driverJson));
        }
        return assignment;
      }).toList();
    } catch (e) {
      // If table doesn't exist or policy blocks, return empty
      print('Error fetching driver assignments: $e');
      return [];
    }
  }
}
