import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, AlertTriangle, Send, Activity, KeyRound } from "lucide-react";
import { useEffect } from "react";

type DiagResult = {
  ok: boolean;
  summary?: {
    phone_number_id: string;
    waba_id: string;
    test_number: string;
    can_send_messages: boolean;
    platform_type: string | null;
    coexistence_mode: boolean;
    verified_name: string | null;
    display_number: string | null;
    quality_rating: string | null;
    name_status: string | null;
    messaging_limit_tier: string | null;
    account_review_status: string | null;
    business_verification_status: string | null;
    approved_templates: { name: string; language: string; category: string }[];
    total_templates: number;
    phones_in_waba: { id: string; number: string; platform_type: string }[];
  };
  raw?: any;
  error?: string;
  missing?: string[];
};

export default function AdminWhatsAppTest() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [diag, setDiag] = useState<DiagResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const [sendKind, setSendKind] = useState<"template" | "text">("template");
  const [sendTemplate, setSendTemplate] = useState("hello_world");
  const [sendLang, setSendLang] = useState("en_US");
  const [sendText, setSendText] = useState("Test desde NEO");
  const [sendTo, setSendTo] = useState("");
  const [sendResult, setSendResult] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const [registerPin, setRegisterPin] = useState("");
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!user) { setRoleLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      setRole(data?.role ?? null);
      setRoleLoading(false);
    })();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "coach") return <Navigate to="/app" replace />;

  const runDiagnostics = async () => {
    setDiagLoading(true);
    setDiag(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-diagnostics");
      if (error) {
        setDiag({ ok: false, error: error.message });
      } else {
        setDiag(data as DiagResult);
        if ((data as DiagResult)?.summary?.test_number) {
          setSendTo((data as DiagResult).summary!.test_number);
        }
      }
    } catch (e) {
      setDiag({ ok: false, error: e instanceof Error ? e.message : "unknown" });
    } finally {
      setDiagLoading(false);
    }
  };

  const sendTest = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const body: any = { to: sendTo, kind: sendKind };
      if (sendKind === "template") {
        body.template_name = sendTemplate;
        body.template_lang = sendLang;
      } else {
        body.text = sendText;
      }
      const { data, error } = await supabase.functions.invoke("whatsapp-send-test", { body });
      setSendResult(error ? { ok: false, error: error.message } : data);
    } catch (e) {
      setSendResult({ ok: false, error: e instanceof Error ? e.message : "unknown" });
    } finally {
      setSending(false);
    }
  };

  const registerNumber = async () => {
    setRegistering(true);
    setRegisterResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-register-number", {
        body: { pin: registerPin },
      });
      setRegisterResult(error ? { ok: false, error: error.message } : data);
    } catch (e) {
      setRegisterResult({ ok: false, error: e instanceof Error ? e.message : "unknown" });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">WhatsApp · Modo Prueba</h1>
          <p className="text-sm text-muted-foreground">Solo lectura + envío con allowlist estricta. No toca atletas.</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Modo cautela activo</AlertTitle>
        <AlertDescription>
          Solo se permite enviar a <code className="font-mono">WHATSAPP_TEST_NUMBER</code>. Cualquier otro destino devuelve 403.
          Las automatizaciones a atletas reales están desactivadas.
        </AlertDescription>
      </Alert>

      {/* Diagnóstico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Diagnóstico</CardTitle>
              <CardDescription>Lee estado del número en Meta sin enviar nada.</CardDescription>
            </div>
            <Button onClick={runDiagnostics} disabled={diagLoading}>
              {diagLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Comprobar
            </Button>
          </div>
        </CardHeader>
        {diag && (
          <CardContent className="space-y-4">
            {diag.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {diag.error}
                  {diag.missing && <div className="mt-2">Faltan: {diag.missing.join(", ")}</div>}
                </AlertDescription>
              </Alert>
            )}
            {diag.summary && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Número" value={diag.summary.display_number || "—"} />
                  <Field label="Verified Name" value={diag.summary.verified_name || "—"} />
                  <Field label="Phone Number ID" value={diag.summary.phone_number_id} mono />
                  <Field label="WABA ID" value={diag.summary.waba_id} mono />
                  <Field label="Platform" value={diag.summary.platform_type || "—"} />
                  <Field label="Coexistence" value={diag.summary.coexistence_mode ? "Sí" : "No"} />
                  <Field label="Quality" value={diag.summary.quality_rating || "—"} />
                  <Field label="Name Status" value={diag.summary.name_status || "—"} />
                  <Field label="Messaging Tier" value={diag.summary.messaging_limit_tier || "—"} />
                  <Field label="Review Status" value={diag.summary.account_review_status || "—"} />
                  <Field label="Business Verif." value={diag.summary.business_verification_status || "—"} />
                  <Field label="Test Number" value={diag.summary.test_number} mono />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">¿Puede enviar?</span>
                  <Badge variant={diag.summary.can_send_messages ? "default" : "destructive"}>
                    {diag.summary.can_send_messages ? "Sí" : "No"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Templates aprobadas ({diag.summary.approved_templates.length}/{diag.summary.total_templates})</h4>
                  <div className="flex flex-wrap gap-2">
                    {diag.summary.approved_templates.length === 0 && <span className="text-xs text-muted-foreground">No hay templates aprobadas. Solo podrás enviar texto dentro de la ventana de 24h tras un mensaje entrante.</span>}
                    {diag.summary.approved_templates.map((t) => (
                      <Badge key={`${t.name}-${t.language}`} variant="outline" className="font-mono text-xs">
                        {t.name} · {t.language}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Ver respuesta cruda de Meta</summary>
              <pre className="mt-2 p-3 bg-muted rounded overflow-auto max-h-80">{JSON.stringify(diag.raw, null, 2)}</pre>
            </details>
          </CardContent>
        )}
      </Card>

      {/* Envío de prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Envío manual</CardTitle>
          <CardDescription>Solo al número en allowlist. Usa template para iniciar conversación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Destino (sin +)</Label>
            <Input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="34600123456" className="font-mono" />
          </div>
          <div className="flex gap-2">
            <Button variant={sendKind === "template" ? "default" : "outline"} size="sm" onClick={() => setSendKind("template")}>Template</Button>
            <Button variant={sendKind === "text" ? "default" : "outline"} size="sm" onClick={() => setSendKind("text")}>Texto libre</Button>
          </div>
          {sendKind === "template" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Template name</Label>
                <Input value={sendTemplate} onChange={(e) => setSendTemplate(e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label>Idioma</Label>
                <Input value={sendLang} onChange={(e) => setSendLang(e.target.value)} className="font-mono" />
              </div>
            </div>
          ) : (
            <div>
              <Label>Texto</Label>
              <Textarea value={sendText} onChange={(e) => setSendText(e.target.value)} rows={3} />
              <p className="text-xs text-muted-foreground mt-1">Solo funciona si tu número ya escribió a la cuenta de WhatsApp Business en las últimas 24h.</p>
            </div>
          )}
          <Button onClick={sendTest} disabled={sending || !sendTo}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar test
          </Button>
          {sendResult && (
            <Alert variant={sendResult.ok ? "default" : "destructive"}>
              <AlertTitle>{sendResult.ok ? "Enviado" : "Error"}</AlertTitle>
              <AlertDescription>
                <pre className="text-xs mt-2 overflow-auto max-h-60">{JSON.stringify(sendResult, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</div>
    </div>
  );
}
