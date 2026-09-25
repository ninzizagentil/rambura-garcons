import mongoose from 'mongoose';
import crypto from 'crypto';
const schema = new mongoose.Schema({
	referenceNumber: { type: String, unique: true, index: true },
	fullName: { type: String, required: true },
	email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
	phone: { type: String, required: true },
	program: String,
	programLabel: String,
	dateOfBirth: String,
	gender: String,
	educationLevel: String,
	district: String,
	previousSchool: String,
	guardianName: String,
	guardianPhone: String,
	guardianRelationship: String,
	emergencyContactName: String,
	emergencyContactPhone: String,
	intakeYear: String,
	applicantPhoto: String,
	supportingDocument: String,
	privacyConsent: { type: Boolean, required: true },
	message: String,
	status: { type: String, enum: ['new', 'reviewed', 'accepted', 'declined'], default: 'new' },
	submittedAt: { type: Date, default: Date.now },
	reviewedAt: Date,
	reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	reviewFeedback: { type: String, maxlength: 5000 },
	adminAttachment: { type: String, maxlength: 3000000 },
	adminAttachmentName: { type: String, maxlength: 255 },
}, { timestamps: true });
schema.index({ status: 1, submittedAt: -1 });
schema.pre('validate', function assignReference() {
	if (!this.referenceNumber) {
		const year = (this.submittedAt || new Date()).getFullYear();
		// crypto (not Math.random) so reference numbers cannot be predicted; no 0/O/1/I to avoid typing mistakes
		const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		const suffix = Array.from(crypto.randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
		this.referenceNumber = `RG-${year}-${suffix}`;
	}
});
export default mongoose.model('Admission', schema);
