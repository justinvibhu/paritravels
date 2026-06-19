from pathlib import Path

p = Path('src/app/App.tsx')
text = p.read_text(encoding='utf-8')

start = text.index('        {/* Step 5: Payment */}\n')
end = text.index('        {/* Step 6: E-Ticket */}\n')

replacement = '''        {/* Step 5: Confirm Booking */}
        {step === 5 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Confirm Booking</h2>
              <p className="text-sm text-gray-600 mb-6">Payment gateway is disabled for now. Your booking will be confirmed immediately and the ticket will be generated.</p>
              <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-3 text-sm text-blue-700">
                  <Shield size={18} className="mt-0.5" />
                  <div>
                    <p className="font-semibold">Booking will be completed without payment</p>
                    <p className="text-gray-600">This temporary flow is for previewing the completed booking and ticket. Payment can be added later.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(4)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleConfirmBooking}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-green-500/20 disabled:opacity-40">
                  <CheckCircle size={16} /> {isCreating ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50 h-fit">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
              <img src={selectedVehicle?.img} alt="" className="w-full h-28 object-cover rounded-xl mb-4 bg-blue-100" />
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Vehicle</span><span className="font-semibold text-gray-900 text-right max-w-[150px]">{selectedVehicle?.name}</span></div>
                <div className="flex justify-between"><span>Route</span><span className="font-semibold text-gray-900">{from} → {to}</span></div>
                <div className="flex justify-between"><span>Date</span><span className="font-semibold text-gray-900">{date}</span></div>
                <div className="flex justify-between"><span>Seats</span><span className="font-semibold text-gray-900">{selectedSeats.join(", ")}</span></div>
                <div className="flex justify-between"><span>Passengers</span><span className="font-semibold text-gray-900">{selectedSeats.length}</span></div>
                <div className="border-t pt-2 flex justify-between text-base font-black text-blue-700">
                  <span>Total</span><span>₹{totalFare.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        '''

new_text = text[:start] + replacement + text[end:]
p.write_text(new_text, encoding='utf-8')
print('Step 5 payment block replaced with confirm booking flow successfully!')
