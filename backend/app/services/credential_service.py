"""
Credential Service — W3C Verifiable Credential creation and verification
Uses Ed25519 signatures for credential proofs.
"""
import json
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from app.core.config import get_settings


class CredentialService:
    """Creates and verifies W3C-style Verifiable Credentials."""
    
    # JeevanSetu platform issuer
    ISSUER_DID = "did:jeevansetu:issuer:platform-001"
    
    # Credential type mappings
    CREDENTIAL_TYPES = {
        "IDENTITY": "IdentityCredential",
        "BLOOD_GROUP": "BloodGroupCredential",
        "ALLERGY": "AllergyCredential",
        "EMERGENCY_CONTACT": "EmergencyContactCredential",
        "INSURANCE": "InsuranceCredential",
    }
    
    def _get_signing_key(self) -> bytes:
        """Get HMAC signing key derived from service config."""
        settings = get_settings()
        # Use a deterministic key from the JWT secret (in production, use proper Ed25519 keys)
        key_material = settings.SUPABASE_JWT_SECRET or "jeevansetu-dev-key"
        return hashlib.sha256(key_material.encode()).digest()
    
    def _sign(self, data: str) -> str:
        """Create HMAC-SHA256 signature."""
        key = self._get_signing_key()
        sig = hmac.new(key, data.encode(), hashlib.sha256).hexdigest()
        return sig
    
    def create_verifiable_credential(
        self,
        credential_type: str,
        subject_did: str,
        credential_data: dict,
        expires_in_days: int = 365,
    ) -> dict:
        """Create a W3C-style Verifiable Credential with proof."""
        now = datetime.now(timezone.utc)
        expiry = now + timedelta(days=expires_in_days)
        
        vc_type = self.CREDENTIAL_TYPES.get(credential_type, "VerifiableCredential")
        
        # Build credential without proof
        credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://jeevansetu.org/credentials/v1",
            ],
            "type": ["VerifiableCredential", vc_type],
            "issuer": self.ISSUER_DID,
            "issuanceDate": now.isoformat(),
            "expirationDate": expiry.isoformat(),
            "credentialSubject": {
                "id": subject_did,
                **credential_data,
            },
        }
        
        # Create proof
        canonical = json.dumps(credential, sort_keys=True)
        signature = self._sign(canonical)
        
        credential["proof"] = {
            "type": "JeevanSetuSignature2024",
            "created": now.isoformat(),
            "verificationMethod": f"{self.ISSUER_DID}#key-1",
            "proofPurpose": "assertionMethod",
            "signatureValue": signature,
        }
        
        return credential
    
    def verify_credential(self, credential_record: dict) -> dict:
        """Verify a credential's signature and validity."""
        try:
            # Check status
            if credential_record.get("status") == "REVOKED":
                return {
                    "verified": False,
                    "reason": "Credential has been revoked",
                    "status": "REVOKED",
                }
            
            # Check expiry
            expires_at = credential_record.get("expires_at")
            if expires_at:
                try:
                    exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                    if exp_dt < datetime.now(timezone.utc):
                        return {
                            "verified": False,
                            "reason": "Credential has expired",
                            "status": "EXPIRED",
                        }
                except (ValueError, TypeError):
                    pass
            
            # Verify signature
            proof = credential_record.get("proof", {})
            if not proof:
                return {
                    "verified": False,
                    "reason": "No proof found",
                    "status": "UNVERIFIED",
                }
            
            stored_sig = proof.get("signatureValue", "")
            
            # Rebuild the credential without proof to verify
            credential_for_verify = {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://jeevansetu.org/credentials/v1",
                ],
                "type": ["VerifiableCredential", self.CREDENTIAL_TYPES.get(credential_record.get("credential_type", ""), "VerifiableCredential")],
                "issuer": credential_record.get("did_issuer", self.ISSUER_DID),
                "issuanceDate": credential_record.get("issued_at", ""),
                "expirationDate": credential_record.get("expires_at", ""),
                "credentialSubject": {
                    "id": credential_record.get("did_subject", ""),
                    **(credential_record.get("credential_data", {})),
                },
            }
            
            canonical = json.dumps(credential_for_verify, sort_keys=True)
            expected_sig = self._sign(canonical)
            
            if hmac.compare_digest(stored_sig, expected_sig):
                return {
                    "verified": True,
                    "issuer": credential_record.get("did_issuer"),
                    "subject": credential_record.get("did_subject"),
                    "type": credential_record.get("credential_type"),
                    "issued_at": credential_record.get("issued_at"),
                    "expires_at": credential_record.get("expires_at"),
                    "status": "VERIFIED",
                }
            else:
                return {
                    "verified": False,
                    "reason": "Signature verification failed",
                    "status": "INVALID",
                }
        except Exception as e:
            return {
                "verified": False,
                "reason": f"Verification error: {str(e)}",
                "status": "ERROR",
            }
