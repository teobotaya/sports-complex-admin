using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SportsComplex.Api.Common;

public sealed class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
{
    private static readonly string[] Formats = ["HH:mm", "HH:mm:ss"];

    public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (value is not null && TimeOnly.TryParseExact(value, Formats, CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var time))
            return time;

        throw new JsonException("La hora debe tener el formato HH:mm.");
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString("HH:mm", CultureInfo.InvariantCulture));
}
