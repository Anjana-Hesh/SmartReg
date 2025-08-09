package lk.ijse.gdse72.backend.entity;

public enum VehicleClass {
    A1("Class A1 - Light Motorcycles (up to 125cc)"),
    A2("Class A2 - Medium Motorcycles (125cc-400cc)"),
    A("Class A - Heavy Motorcycles (above 400cc)"),
    AM("Class AM - Mopeds (up to 50cc)"),
    B1("Class B1 - Light Motor Cars (up to 1000cc)"),
    B("Class B - Motor Cars (above 1000cc)"),
    C1("Class C1 - Light Goods Vehicles (3.5t-7.5t)"),
    C("Class C - Heavy Goods Vehicles (above 7.5t)"),
    CE("Class CE - Articulated Heavy Goods Vehicles"),
    D1("Class D1 - Minibuses (9-16 seats)"),
    D("Class D - Large Buses (above 16 seats)"),
    DE("Class DE - Articulated Buses"),
    G1("Class G1 - Agricultural Tractors"),
    G("Class G - Heavy Agricultural Vehicles"),
    H("Class H - Construction Vehicles"),
    J1("Class J1 - Three Wheeler (Commercial)"),
    J2("Class J2 - Taxi/Hire Cars"),
    J3("Class J3 - Tourist Transport Vehicles"),
    F("Class F - Emergency Vehicles (Ambulance, Fire)"),
    K("Class K - Military Vehicles"),
    L("Class L - Special Construction Vehicles"),
    M("Class M - Cranes and Mobile Equipment"),
    N("Class N - Road Maintenance Vehicles"),
    P("Class P - Police Vehicles"),
    Q("Class Q - Three Wheelers (Private)"),
    R("Class R - Racing Vehicles"),
    S("Class S - School Transport");

    private final String description;

    VehicleClass(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public static VehicleClass fromCode(String code) {
        try {
            return valueOf(code);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static String getDescription(String code) {
        VehicleClass vehicleClass = fromCode(code);
        return vehicleClass != null ? vehicleClass.getDescription() : "Unknown Vehicle Class";
    }
}