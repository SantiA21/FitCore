using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using FitCore.Application.DTOs;
using FitCore.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FitCore.Infrastructure.Services;

public class MercadoPagoService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<MercadoPagoService> _logger;

    public MercadoPagoService(
        HttpClient httpClient,
        IConfiguration config,
        ILogger<MercadoPagoService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<MercadoPagoPreferenceResponse> CrearPreferencia(
        AppUser user,
        Plan plan,
        string? backUrlSuccess,
        string? backUrlFailure,
        string? backUrlPending)
    {
        var accessToken = _config["MercadoPago:AccessToken"]
            ?? Environment.GetEnvironmentVariable("MERCADOPAGO_ACCESS_TOKEN");

        // Si no hay token configurado o es el placeholder de ejemplo, operamos en modo simulado para desarrollo
        if (string.IsNullOrWhiteSpace(accessToken) || accessToken.StartsWith("TEST-00000000"))
        {
            _logger.LogInformation("Mercado Pago AccessToken no configurado o de prueba. Operando en modo sandbox simulado.");
            var simId = $"SIM-PREF-{Guid.NewGuid():N}";
            var simInitPoint = $"/dashboard-cliente?mp_simulated=true&pref_id={simId}&plan_id={plan.Id}";

            return new MercadoPagoPreferenceResponse(
                PreferenceId: simId,
                InitPoint: simInitPoint,
                SandboxInitPoint: simInitPoint,
                IsSimulated: true
            );
        }

        try
        {
            var fallbackBase = _config["ClientUrl"] ?? "http://localhost:5173";
            var success = string.IsNullOrWhiteSpace(backUrlSuccess) ? $"{fallbackBase}/dashboard-cliente?mp_status=approved" : backUrlSuccess;
            var failure = string.IsNullOrWhiteSpace(backUrlFailure) ? $"{fallbackBase}/dashboard-cliente?mp_status=failure" : backUrlFailure;
            var pending = string.IsNullOrWhiteSpace(backUrlPending) ? $"{fallbackBase}/dashboard-cliente?mp_status=pending" : backUrlPending;

            var isLocalhost = success.Contains("localhost", StringComparison.OrdinalIgnoreCase);

            var payload = new Dictionary<string, object>
            {
                ["items"] = new[]
                {
                    new
                    {
                        title = $"FitCore - Plan {plan.Nombre}",
                        description = $"Acceso por {plan.DuracionEnDias} días",
                        quantity = 1,
                        currency_id = "ARS",
                        unit_price = Convert.ToDouble(plan.Precio)
                    }
                },
                ["payer"] = new
                {
                    name = user.Nombre,
                    surname = user.Apellido,
                    email = user.Email
                },
                ["back_urls"] = new Dictionary<string, string>
                {
                    ["success"] = success,
                    ["failure"] = failure,
                    ["pending"] = pending
                },
                ["external_reference"] = $"{user.Id}_{plan.Id}_{DateTime.UtcNow.Ticks}"
            };

            if (!isLocalhost)
            {
                payload["auto_return"] = "approved";
            }

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.mercadopago.com/checkout/preferences")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Error en API de Mercado Pago: {Status} - {Body}", response.StatusCode, responseContent);
                // Fallback a modo simulado para no interrumpir el flujo si las credenciales fallan
                var simId = $"SIM-FALLBACK-{Guid.NewGuid():N}";
                return new MercadoPagoPreferenceResponse(
                    PreferenceId: simId,
                    InitPoint: $"/dashboard-cliente?mp_simulated=true&pref_id={simId}&plan_id={plan.Id}",
                    SandboxInitPoint: $"/dashboard-cliente?mp_simulated=true&pref_id={simId}&plan_id={plan.Id}",
                    IsSimulated: true
                );
            }

            var node = JsonNode.Parse(responseContent);
            var prefId = node?["id"]?.ToString() ?? Guid.NewGuid().ToString();
            var initPoint = node?["init_point"]?.ToString() ?? "";
            var sandboxInitPoint = node?["sandbox_init_point"]?.ToString();

            return new MercadoPagoPreferenceResponse(
                PreferenceId: prefId,
                InitPoint: initPoint,
                SandboxInitPoint: sandboxInitPoint,
                IsSimulated: false
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al conectar con Mercado Pago");
            var simId = $"SIM-ERR-{Guid.NewGuid():N}";
            return new MercadoPagoPreferenceResponse(
                PreferenceId: simId,
                InitPoint: $"/dashboard-cliente?mp_simulated=true&pref_id={simId}&plan_id={plan.Id}",
                SandboxInitPoint: $"/dashboard-cliente?mp_simulated=true&pref_id={simId}&plan_id={plan.Id}",
                IsSimulated: true
            );
        }
    }
}
